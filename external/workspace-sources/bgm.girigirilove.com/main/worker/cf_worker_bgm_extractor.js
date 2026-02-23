import {
  extractSingleVariableFromHtml,
  stringifyObjectLiteral,
} from "./ast_env_worker.mjs";

/**
 * Cloudflare Worker: BGM CTF Extractor (zero external deps)
 *
 * Endpoints:
 * - GET /health
 * - GET /extract?entry=<DETAIL_OR_PLAY_URL>&limit=20
 *
 * Security:
 * - Restricts entry URL host/path to avoid SSRF/open-proxy abuse.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36";
const TIMEOUT_MS = 25000;
const RETRY_COUNT = 2;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const ALLOWED_ENTRY_HOSTS = new Set(["bgm.girigirilove.com"]);
const ALLOWED_ENTRY_PATH_RE = /^\/(GV\d+\/|playGV\d+-\d+-\d+\/?)$/i;

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function text(data, status = 200, extraHeaders = {}) {
  return new Response(data, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        "user-agent": UA,
        "accept-language": "zh-CN,zh;q=0.9",
        ...(init.headers || {}),
      },
      signal: controller.signal,
    });
    const body = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}\n${body.slice(0, 200)}`);
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchTextWithRetry(url, init = {}, retryCount = RETRY_COUNT) {
  let lastErr = null;
  for (let i = 0; i <= retryCount; i += 1) {
    try {
      return await fetchText(url, init);
    } catch (err) {
      lastErr = err;
      if (i < retryCount) await sleep(500 * (i + 1));
    }
  }
  throw lastErr;
}

function toAbsoluteUrl(base, maybeRelative) {
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return maybeRelative;
  }
}

function unique(arr) {
  return [...new Set(arr)];
}

function extractPlayLinks(html, baseUrl) {
  const links = [];
  const hrefRe = /href=(["'])(.*?)\1/gi;
  let m;
  while ((m = hrefRe.exec(html))) {
    const href = m[2];
    if (/\/playGV\d+-\d+-\d+\/?/i.test(href)) {
      links.push(toAbsoluteUrl(baseUrl, href));
    }
  }
  const dedup = unique(links).map((x) => (x.endsWith("/") ? x : `${x}/`));
  dedup.sort((a, b) => {
    const am = a.match(/playGV(\d+)-(\d+)-(\d+)\//i);
    const bm = b.match(/playGV(\d+)-(\d+)-(\d+)\//i);
    if (!am || !bm) return a.localeCompare(b);
    const asid = Number(am[2]);
    const bsid = Number(bm[2]);
    const anid = Number(am[3]);
    const bnid = Number(bm[3]);
    return asid - bsid || anid - bnid;
  });
  return dedup;
}

function extractJsonObjectByMarker(html, marker) {
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) return null;

  const start = html.indexOf("{", markerIdx);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < html.length; i += 1) {
    const ch = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return html.slice(start, i + 1);
      }
    }
  }

  return null;
}

function extractJsonObjectAstFirst(html, variableName, fallbackMarker) {
  try {
    const astValue = extractSingleVariableFromHtml(html, variableName, {
      timeoutMs: 120,
    });
    const astLiteral = stringifyObjectLiteral(astValue);
    if (astLiteral) return astLiteral;
  } catch {
    // ignore AST path errors and fallback
  }
  return extractJsonObjectByMarker(html, fallbackMarker);
}

function extractPlayerConfig(html) {
  const jsonText = extractJsonObjectAstFirst(html, "player_aaaa", "var player_aaaa");
  if (!jsonText) return null;
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function extractAtomIframeUrl(html, playPageUrl) {
  const frameRe = /<iframe[^>]*\ssrc=(["'])(.*?)\1[^>]*>/gi;
  let m;
  while ((m = frameRe.exec(html))) {
    const src = (m[2] || "").replace(/&amp;/g, "&");
    if (/atom\.php/i.test(src)) {
      return toAbsoluteUrl(playPageUrl, src);
    }
  }
  return null;
}

function tryAtob(s) {
  // atob expects valid base64; avoid obvious non-base64 strings.
  if (!s || typeof s !== "string") return null;
  const t = s.trim();
  if (!/^[A-Za-z0-9+/=]+$/.test(t)) return null;
  if (t.length % 4 !== 0) return null;
  try {
    return atob(t);
  } catch {
    return null;
  }
}

function decodePlayerUrl(encodedUrl) {
  if (!encodedUrl || typeof encodedUrl !== "string") return null;
  let out = encodedUrl.trim();

  const b64 = tryAtob(out);
  if (b64) out = b64;

  try {
    if (/%[0-9A-Fa-f]{2}/.test(out)) out = decodeURIComponent(out);
  } catch {
    // noop
  }

  return /^https?:\/\//i.test(out) ? out : null;
}

function m3u8FromAtomUrl(atomUrl) {
  if (!atomUrl) return null;
  try {
    const u = new URL(atomUrl);
    return u.searchParams.get("url");
  } catch {
    return null;
  }
}

async function fetchSubtitleUrl(m3u8Url) {
  if (!m3u8Url) return null;
  const api = "https://m3u8.girigirilove.com/api.php/Scrolling/getVodOutScrolling";
  const body = JSON.stringify({ play_url: m3u8Url });
  const textBody = await fetchTextWithRetry(api, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  let data;
  try {
    data = JSON.parse(textBody);
  } catch {
    return null;
  }
  if (data && data.code === 1 && typeof data.info === "string" && data.info) return data.info;
  return null;
}

async function processPlayPage(playUrl) {
  const html = await fetchTextWithRetry(playUrl);
  const player = extractPlayerConfig(html);
  let atomUrl = extractAtomIframeUrl(html, playUrl);

  let m3u8Url = m3u8FromAtomUrl(atomUrl);
  if (!m3u8Url && player && typeof player.url === "string") {
    m3u8Url = decodePlayerUrl(player.url);
  }
  if (!atomUrl && m3u8Url) {
    atomUrl = `https://m3u8.girigirilove.com/addons/aplyer/atom.php?key=0&url=${encodeURIComponent(
      m3u8Url,
    )}`;
  }

  const subtitleUrl = await fetchSubtitleUrl(m3u8Url);

  return {
    play_url: playUrl,
    sid: player && typeof player.sid === "number" ? player.sid : player?.sid ?? null,
    nid: player && typeof player.nid === "number" ? player.nid : player?.nid ?? null,
    line: player?.from ?? null,
    atom_url: atomUrl,
    m3u8_url: m3u8Url,
    subtitle_url: subtitleUrl,
  };
}

function isAllowedEntryUrl(entryUrl) {
  let u;
  try {
    u = new URL(entryUrl);
  } catch {
    return { ok: false, err: "entry 不是合法 URL" };
  }

  if (u.protocol !== "https:" && u.protocol !== "http:") {
    return { ok: false, err: "entry 协议必须是 http/https" };
  }
  if (!ALLOWED_ENTRY_HOSTS.has(u.hostname)) {
    return { ok: false, err: `不允许的 entry host: ${u.hostname}` };
  }
  if (!ALLOWED_ENTRY_PATH_RE.test(u.pathname)) {
    return { ok: false, err: `不允许的 entry path: ${u.pathname}` };
  }
  return { ok: true, url: u };
}

async function resolvePlayPages(entryUrl, limit) {
  if (/\/playGV\d+-\d+-\d+\/?$/i.test(entryUrl)) {
    return [entryUrl.endsWith("/") ? entryUrl : `${entryUrl}/`];
  }
  const detailHtml = await fetchTextWithRetry(entryUrl);
  const links = extractPlayLinks(detailHtml, entryUrl);
  return links.slice(0, limit);
}

async function handleExtract(reqUrl) {
  const entry = reqUrl.searchParams.get("entry") || reqUrl.searchParams.get("url");
  if (!entry) return json({ error: "缺少参数 entry" }, 400);

  const limitRaw = reqUrl.searchParams.get("limit");
  const limit = Math.max(
    1,
    Math.min(MAX_LIMIT, Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : DEFAULT_LIMIT),
  );

  const allowed = isAllowedEntryUrl(entry);
  if (!allowed.ok) return json({ error: allowed.err }, 400);

  const playPages = await resolvePlayPages(allowed.url.toString(), limit);
  if (playPages.length === 0) return json({ error: "未找到播放页" }, 404);

  const results = [];
  for (const playUrl of playPages) {
    try {
      results.push(await processPlayPage(playUrl));
    } catch (err) {
      results.push({ play_url: playUrl, error: String(err && err.message ? err.message : err) });
    }
  }

  return json({
    entry: allowed.url.toString(),
    limit,
    count: results.length,
    results,
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
    }

    if (request.method !== "GET") {
      return json({ error: "仅支持 GET/OPTIONS" }, 405);
    }

    if (url.pathname === "/health") {
      return json({ ok: true, ts: new Date().toISOString() });
    }

    if (url.pathname === "/extract") {
      try {
        return await handleExtract(url);
      } catch (err) {
        return json({ error: String(err && err.message ? err.message : err) }, 500);
      }
    }

    return text(
      [
        "BGM CTF Extractor Worker",
        "",
        "GET /health",
        "GET /extract?entry=https://bgm.girigirilove.com/GV26896/&limit=20",
      ].join("\n"),
    );
  },
};
