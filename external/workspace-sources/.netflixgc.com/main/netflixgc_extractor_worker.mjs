import {
  extractSingleVariableFromHtml,
  stringifyObjectLiteral,
} from "./worker_ast_env.mjs";

export default {
  async fetch(request, env, ctx) {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders() });
      }
      if (request.method !== "GET") {
        return json({ ok: false, error: "只支持 GET/OPTIONS" }, 405);
      }

      const url = new URL(request.url);
      const playUrl = url.searchParams.get("play_url") || "";
      const allLines = (url.searchParams.get("all_lines") || "").trim() === "1";
      const maxDepth = clampInt(url.searchParams.get("max_depth"), 0, 5, 2);

      if (!playUrl) {
        return json(
          {
            ok: false,
            error: "缺少参数 play_url，例如 ?play_url=https%3A%2F%2Fwww.netflixgc.com%2Fplay%2F80498-1-1.html",
          },
          400
        );
      }

      const inputPlayUrl = normalizeHttpsUrl(playUrl);
      if (!inputPlayUrl) {
        return json({ ok: false, error: "play_url 必须是 https URL" }, 400);
      }

      // 基础 SSRF 防护：只允许访问与题目相关的域名。
      // 如需放开，建议在部署时增加密钥鉴权或进一步收紧。
      if (!isAllowedUrl(inputPlayUrl)) {
        return json(
          { ok: false, error: "play_url 域名不在允许列表内" },
          400
        );
      }

      const t0 = Date.now();
      const result = await solve(inputPlayUrl, { allLines, maxDepth });
      const costMs = Date.now() - t0;

      return json(
        {
          ok: true,
          cost_ms: costMs,
          ...result,
        },
        200
      );
    } catch (e) {
      return json(
        {
          ok: false,
          error: e && e.message ? e.message : String(e),
        },
        500
      );
    }
  },
};

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: {
      ...corsHeaders(),
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function clampInt(v, min, max, def) {
  if (v === null || v === undefined || String(v).trim() === "") return def;
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function normalizeHttpsUrl(s) {
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

function isAllowedUrl(s) {
  let u;
  try {
    u = new URL(s);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;

  const host = u.hostname.toLowerCase();
  const allow = new Set([
    "netflixgc.com",
    "www.netflixgc.com",
    "cjbfq.netflixgc.tv",
    "myvideo.nfgc.tv",
    "json.ksdiy.cn",
    "vip.ffzy-video.com",
    "vip.dytt-see.com",
    "cdn.yzzy29-play.com",
  ]);

  if (allow.has(host)) return true;
  if (host.endsWith(".netflixgc.com")) return true;
  if (host.endsWith(".netflixgc.tv")) return true;
  if (host.endsWith(".nfgc.tv")) return true;
  return false;
}

async function fetchText(url, { referer = "", timeoutMs = 20000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = {
      accept: "*/*",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    };
    if (referer) headers.referer = referer;

    const res = await fetch(url, {
      method: "GET",
      headers,
      redirect: "follow",
      signal: controller.signal,
    });
    const text = await res.text();
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function extractJsonObjectAstFirst(text, variableName, fallbackMarker) {
  try {
    const astValue = extractSingleVariableFromHtml(text, variableName, {
      timeoutMs: 120,
    });
    const astLiteral = stringifyObjectLiteral(astValue);
    if (astLiteral) return astLiteral;
  } catch {
    // ignore AST path errors and fallback
  }
  return extractJsonObject(text, fallbackMarker);
}

function extractJsonObject(text, marker) {
  const markerPos = text.indexOf(marker);
  if (markerPos < 0) throw new Error(`marker not found: ${marker}`);
  const start = text.indexOf("{", markerPos + marker.length);
  if (start < 0) throw new Error(`no object after marker: ${marker}`);

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
    } else {
      if (ch === '"') inString = true;
      else if (ch === "{") depth += 1;
      else if (ch === "}") {
        depth -= 1;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
  }
  throw new Error(`unterminated object after marker: ${marker}`);
}

function decodePlayerUrl(encrypt, rawUrl) {
  const enc = Number(encrypt || 0);
  if (enc === 2) {
    const bytes = base64ToBytes(rawUrl);
    const s = new TextDecoder("utf-8").decode(bytes);
    return decodeURIComponent(s);
  }
  if (enc === 1) return decodeURIComponent(rawUrl);
  return rawUrl;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractParseBase(playerConfigJs, sourceFrom) {
  const re = new RegExp(
    `"${escapeRegex(sourceFrom)}":\\{[^}]*"parse":"([^"]*)"`,
    "m"
  );
  const m = playerConfigJs.match(re);
  if (!m) return "";
  return m[1].replace(/\\\//g, "/");
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function pkcs7Unpad(bytes) {
  if (!bytes.length) return bytes;
  const pad = bytes[bytes.length - 1];
  if (pad < 1 || pad > 16) return bytes;
  for (let i = bytes.length - pad; i < bytes.length; i += 1) {
    if (bytes[i] !== pad) return bytes;
  }
  return bytes.slice(0, bytes.length - pad);
}

async function decryptFinalUrl(cipherB64, uid) {
  if (!cipherB64 || !uid) return "";
  const keyRaw = new TextEncoder().encode(`2890${uid}tB959C`);
  const iv = new TextEncoder().encode("2F131BE91247866E");
  const key = await crypto.subtle.importKey(
    "raw",
    keyRaw,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    key,
    base64ToBytes(cipherB64)
  );
  const plainBytes = pkcs7Unpad(new Uint8Array(plainBuf));
  return new TextDecoder("utf-8").decode(plainBytes).trim();
}

function extractPlayLinks(playHtml, playUrl) {
  const re = /href="(\/play\/[^"]+)"/g;
  const set = new Set([playUrl]);
  let m;
  while ((m = re.exec(playHtml)) !== null) {
    set.add(new URL(m[1], playUrl).toString());
  }
  return Array.from(set).sort();
}

function subtitleCandidatesFromText(text, baseUrl) {
  const out = new Set();
  const absRe = /https?:\/\/[^\s"'<>]+\.(?:vtt|srt|ass)(?:\?[^\s"'<>]*)?/gi;
  const relRe = /(^|["'\s(])(\/[^"'>\s]+\.(?:vtt|srt|ass)(?:\?[^\s"'<>]*)?)/gim;

  let m;
  while ((m = absRe.exec(text)) !== null) out.add(m[0]);
  while ((m = relRe.exec(text)) !== null)
    out.add(new URL(m[2], baseUrl).toString());
  return out;
}

async function collectSubtitlesFromM3u8(startUrl, { timeoutMs, maxDepth }) {
  const subtitles = new Set();
  const visited = new Set();

  async function walk(url, depth) {
    if (depth < 0 || visited.has(url)) return;
    visited.add(url);

    let text;
    try {
      text = await fetchText(url, { timeoutMs });
    } catch {
      return;
    }

    for (const s of subtitleCandidatesFromText(text, url)) subtitles.add(s);

    for (const line0 of text.split(/\r?\n/)) {
      const line = line0.trim();
      if (!line) continue;

      if (line.startsWith("#EXT-X-MEDIA") && /TYPE=SUBTITLES/i.test(line)) {
        const mm = line.match(/URI="([^"]+)"/i);
        if (mm) subtitles.add(new URL(mm[1], url).toString());
      }

      if (depth > 0 && !line.startsWith("#") && /\.m3u8(?:\?|$)/i.test(line)) {
        await walk(new URL(line, url).toString(), depth - 1);
      }
    }
  }

  await walk(startUrl, maxDepth);
  return subtitles;
}

async function solveOneLine(playUrl, { timeoutMs, maxDepth }) {
  const playHtml = await fetchText(playUrl, { timeoutMs });
  const player = JSON.parse(
    extractJsonObjectAstFirst(playHtml, "player_aaaa", "var player_aaaa=")
  );

  const sourceFrom = String(player.from || "");
  const rawSourceUrl = decodePlayerUrl(player.encrypt, String(player.url || ""));

  const cfgPathMatch = playHtml.match(
    /src="(\/static\/js\/playerconfig\.js[^"]*)"/
  );
  if (!cfgPathMatch) throw new Error("playerconfig.js path not found");

  const playerConfigUrl = new URL(cfgPathMatch[1], playUrl).toString();
  const playerConfigJs = await fetchText(playerConfigUrl, {
    referer: playUrl,
    timeoutMs,
  });

  const parseBase = extractParseBase(playerConfigJs, sourceFrom);
  let parseUrl = "";
  let finalSourceUrl = rawSourceUrl;
  const subtitles = new Set();

  if (parseBase) {
    parseUrl = parseBase + rawSourceUrl;
    const parseHtml = await fetchText(parseUrl, {
      referer: playUrl,
      timeoutMs,
    });
    const cfg = JSON.parse(
      extractJsonObjectAstFirst(parseHtml, "ConFig", "let ConFig = ")
    );

    const uid = String(cfg?.config?.uid || "");
    const cipherUrl = String(cfg?.url || "");
    finalSourceUrl = await decryptFinalUrl(cipherUrl, uid);

    const zmUrl = String(cfg?.config?.zm_url || "").trim();
    if (zmUrl) subtitles.add(new URL(zmUrl, parseUrl).toString());
  }

  if (/\.m3u8(?:\?|$)/i.test(finalSourceUrl)) {
    const s = await collectSubtitlesFromM3u8(finalSourceUrl, {
      timeoutMs,
      maxDepth,
    });
    for (const v of s) subtitles.add(v);
  } else if (/\.(?:vtt|srt|ass)(?:\?|$)/i.test(finalSourceUrl)) {
    subtitles.add(finalSourceUrl);
  }

  return {
    play_url: playUrl,
    source_from: sourceFrom,
    raw_source_url: rawSourceUrl,
    parse_url: parseUrl,
    final_source_url: finalSourceUrl,
    subtitles: Array.from(subtitles).sort(),
    error: "",
  };
}

async function solve(playUrl, { allLines, maxDepth }) {
  const timeoutMs = 20000;
  const firstHtml = await fetchText(playUrl, { timeoutMs });
  const targets = allLines ? extractPlayLinks(firstHtml, playUrl) : [playUrl];

  // 避免 Worker 超时：限制最多处理 20 条线路
  const limitedTargets = targets.slice(0, 20);

  const lines = [];
  const finalSources = new Set();
  const allSubtitles = new Set();

  for (const u of limitedTargets) {
    try {
      if (!isAllowedUrl(u)) {
        lines.push({
          play_url: u,
          source_from: "",
          raw_source_url: "",
          parse_url: "",
          final_source_url: "",
          subtitles: [],
          error: "play_url 域名不在允许列表内",
        });
        continue;
      }

      const item = await solveOneLine(u, { timeoutMs, maxDepth });
      lines.push(item);
      if (item.final_source_url) finalSources.add(item.final_source_url);
      for (const s of item.subtitles) allSubtitles.add(s);
    } catch (e) {
      lines.push({
        play_url: u,
        source_from: "",
        raw_source_url: "",
        parse_url: "",
        final_source_url: "",
        subtitles: [],
        error: e && e.message ? e.message : String(e),
      });
    }
  }

  return {
    input_play_url: playUrl,
    all_lines: allLines,
    max_depth: maxDepth,
    final_sources: Array.from(finalSources).sort(),
    all_subtitles: Array.from(allSubtitles).sort(),
    lines,
    note:
      targets.length > limitedTargets.length
        ? `已限制线路数: ${limitedTargets.length}/${targets.length}`
        : "",
  };
}
