#!/usr/bin/env node
"use strict";

/**
 * 零第三方依赖的 ikanbot CTF keygen 脚本。
 *
 * 目标：
 * 1) 解析 play 页隐藏字段（current_id / e_token / mtype）
 * 2) 复现前端 token 生成逻辑
 * 3) 调用 /api/getResN 获取全部线路源
 * 4) 递归 m3u8，输出最终播放源（leaf media playlist）和全部字幕链接
 *
 * 示例：
 *   node ikanbot_keygen.js https://v.ikanbot.com/play/962794
 *   node ikanbot_keygen.js https://v.ikanbot.com/play/962794 --resolve v.ikanbot.com:443:198.18.1.251
 */

const http = require("node:http");
const https = require("node:https");
const dns = require("node:dns");
const net = require("node:net");
const { URL } = require("node:url");
const { extractSingleVariableFromHtml } = require("./ast_env");

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";
const SUBTITLE_EXTS = [".vtt", ".srt", ".ass", ".ssa", ".ttml"];
const M3U8_RE = /\.m3u8(?:\?|$)/i;
const URI_ATTR_RE = /URI="([^"]+)"/i;

function printUsageAndExit(code = 1, message = "") {
  if (message) {
    console.error(message);
  }
  console.error(
    "用法: node ikanbot_keygen.js <play_url> [--max-depth N] [--ua UA] [--resolve host:ip|host:port:ip] [--insecure]"
  );
  process.exit(code);
}

function parseArgs(argv) {
  const out = {
    playUrl: "",
    maxDepth: 2,
    ua: DEFAULT_UA,
    insecure: false,
    resolveRules: [],
  };

  if (argv.length < 1) {
    printUsageAndExit(1, "缺少 play_url");
  }

  out.playUrl = argv[0];

  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--max-depth") {
      i += 1;
      if (i >= argv.length) {
        printUsageAndExit(1, "--max-depth 需要参数");
      }
      const n = Number(argv[i]);
      if (!Number.isInteger(n) || n < 0 || n > 10) {
        printUsageAndExit(1, "--max-depth 必须是 0-10 的整数");
      }
      out.maxDepth = n;
      continue;
    }
    if (arg === "--ua") {
      i += 1;
      if (i >= argv.length) {
        printUsageAndExit(1, "--ua 需要参数");
      }
      out.ua = argv[i];
      continue;
    }
    if (arg === "--insecure") {
      out.insecure = true;
      continue;
    }
    if (arg === "--resolve") {
      i += 1;
      if (i >= argv.length) {
        printUsageAndExit(1, "--resolve 需要参数");
      }
      const rule = parseResolveRule(argv[i]);
      out.resolveRules.push(rule);
      continue;
    }
    printUsageAndExit(1, `未知参数: ${arg}`);
  }

  return out;
}

function parseResolveRule(raw) {
  const parts = raw.split(":");
  if (parts.length === 2) {
    const [host, ip] = parts;
    if (!host || !net.isIP(ip)) {
      printUsageAndExit(1, `非法 --resolve 规则: ${raw}`);
    }
    return { host, port: null, ip };
  }
  if (parts.length === 3) {
    const [host, portRaw, ip] = parts;
    const port = Number(portRaw);
    if (!host || !Number.isInteger(port) || port <= 0 || port > 65535 || !net.isIP(ip)) {
      printUsageAndExit(1, `非法 --resolve 规则: ${raw}`);
    }
    return { host, port, ip };
  }
  printUsageAndExit(1, `非法 --resolve 规则: ${raw}`);
}

function normalizePlayUrl(raw) {
  let urlText = raw.trim();
  if (!/^https?:\/\//i.test(urlText)) {
    urlText = `https://${urlText}`;
  }
  let u;
  try {
    u = new URL(urlText);
  } catch (err) {
    printUsageAndExit(1, `非法 URL: ${raw}`);
  }
  if (!u.hostname) {
    printUsageAndExit(1, `非法 URL: ${raw}`);
  }
  return u;
}

function getHostFromSetCookieDomain(domain, fallbackHost) {
  if (!domain) {
    return fallbackHost;
  }
  return String(domain).replace(/^\./, "").toLowerCase();
}

function createCookieJar() {
  const jar = new Map();

  function setCookieFromHeader(hostname, setCookieHeader) {
    if (!setCookieHeader) {
      return;
    }
    const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    for (const header of headers) {
      if (!header || typeof header !== "string") {
        continue;
      }
      const parts = header.split(";").map((x) => x.trim());
      if (parts.length < 1 || !parts[0].includes("=")) {
        continue;
      }
      const [k, ...vParts] = parts[0].split("=");
      const v = vParts.join("=");
      if (!k) {
        continue;
      }

      let domain = "";
      for (let i = 1; i < parts.length; i += 1) {
        const p = parts[i];
        const idx = p.indexOf("=");
        if (idx > 0 && p.slice(0, idx).toLowerCase() === "domain") {
          domain = p.slice(idx + 1).trim();
        }
      }
      const keyHost = getHostFromSetCookieDomain(domain, hostname);
      if (!jar.has(keyHost)) {
        jar.set(keyHost, new Map());
      }
      jar.get(keyHost).set(k.trim(), v.trim());
    }
  }

  function getCookieHeader(hostname) {
    const host = hostname.toLowerCase();
    const parts = [];
    for (const [cookieHost, kv] of jar.entries()) {
      if (host === cookieHost || host.endsWith(`.${cookieHost}`)) {
        for (const [k, v] of kv.entries()) {
          parts.push(`${k}=${v}`);
        }
      }
    }
    return parts.join("; ");
  }

  return { setCookieFromHeader, getCookieHeader };
}

function createHttpClient({ ua, insecure, resolveRules }) {
  const cookieJar = createCookieJar();

  function resolveIp(hostname, port) {
    for (const rule of resolveRules) {
      if (rule.host.toLowerCase() !== hostname.toLowerCase()) {
        continue;
      }
      if (rule.port === null || Number(rule.port) === Number(port)) {
        return rule.ip;
      }
    }
    return null;
  }

  function makeLookup(hostname, port) {
    const fixedIp = resolveIp(hostname, port);
    if (!fixedIp) {
      return dns.lookup;
    }
    const family = net.isIP(fixedIp) || 4;
    return (queryHost, options, cb) => {
      let callback = cb;
      let lookupOptions = options;
      if (typeof options === "function") {
        callback = options;
        lookupOptions = {};
      }
      if (lookupOptions && lookupOptions.all) {
        callback(null, [{ address: fixedIp, family }]);
      } else {
        callback(null, fixedIp, family);
      }
    };
  }

  function onceRequest(urlObj, options = {}) {
    return new Promise((resolve, reject) => {
      const isHttps = urlObj.protocol === "https:";
      const lib = isHttps ? https : http;
      const headers = {
        "user-agent": ua,
        accept: "*/*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
        "accept-encoding": "identity",
        connection: "keep-alive",
        ...(options.headers || {}),
      };

      const cookieHeader = cookieJar.getCookieHeader(urlObj.hostname);
      if (cookieHeader && !headers.cookie) {
        headers.cookie = cookieHeader;
      }

      const reqOptions = {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: `${urlObj.pathname}${urlObj.search}`,
        method: options.method || "GET",
        headers,
        timeout: options.timeoutMs || 20000,
        lookup: makeLookup(urlObj.hostname, urlObj.port || (isHttps ? 443 : 80)),
      };

      if (isHttps) {
        reqOptions.servername = urlObj.hostname;
        reqOptions.rejectUnauthorized = !insecure;
      }

      const req = lib.request(reqOptions, (res) => {
        cookieJar.setCookieFromHeader(urlObj.hostname, res.headers["set-cookie"]);
        const chunks = [];
        res.on("data", (buf) => chunks.push(buf));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          resolve({
            statusCode: Number(res.statusCode || 0),
            headers: res.headers,
            body,
            finalUrl: urlObj.toString(),
          });
        });
      });

      req.on("timeout", () => {
        req.destroy(new Error("request timeout"));
      });
      req.on("error", reject);
      req.end(options.body || undefined);
    });
  }

  async function request(urlLike, options = {}) {
    const retries = Number.isInteger(options.retries) ? options.retries : 3;
    const maxRedirects = Number.isInteger(options.maxRedirects) ? options.maxRedirects : 5;

    let current = new URL(String(urlLike));
    let lastErr = null;

    for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
      for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
          const res = await onceRequest(current, options);
          const code = res.statusCode;

          if ([301, 302, 303, 307, 308].includes(code)) {
            const loc = res.headers.location;
            if (!loc) {
              return res;
            }
            current = new URL(loc, current);
            break;
          }

          if ((code === 429 || code >= 500) && attempt < retries) {
            await sleep(300 * (attempt + 1));
            continue;
          }

          return res;
        } catch (err) {
          lastErr = err;
          if (attempt >= retries) {
            throw err;
          }
          await sleep(300 * (attempt + 1));
        }
      }
    }

    if (lastErr) {
      throw lastErr;
    }
    throw new Error(`redirect exceeded for ${urlLike}`);
  }

  return { request };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractHiddenValue(html, id) {
  const candidates = buildAstNameCandidates(id);
  for (const name of candidates) {
    const astValue = extractSingleVariableFromHtml(html, name, {
      timeoutMs: 120,
    });
    if (typeof astValue === "string" && astValue.trim()) {
      return astValue.trim();
    }
    if (typeof astValue === "number" || typeof astValue === "boolean") {
      return String(astValue);
    }
  }

  const re = new RegExp(`id="${escapeRegExp(id)}"\\s+value="([^"]*)"`);
  const m = html.match(re);
  if (!m) {
    throw new Error(`找不到隐藏字段: ${id}`);
  }
  return m[1];
}

function buildAstNameCandidates(id) {
  const raw = String(id || "").trim();
  if (!raw) return [];
  const low = raw.toLowerCase();
  const camel = low.replace(/[-_]+([a-z0-9])/g, (_, c) => c.toUpperCase());
  const noSep = low.replace(/[-_]+/g, "");
  return [...new Set([raw, low, camel, noSep])];
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildToken(videoId, eToken) {
  const digits = String(videoId).slice(-4);
  let remain = eToken;
  const parts = [];
  for (const ch of digits) {
    if (!/^\d$/.test(ch)) {
      throw new Error(`videoId 非数字: ${videoId}`);
    }
    const pos = (Number(ch) % 3) + 1;
    const end = pos + 8;
    if (end > remain.length) {
      throw new Error("e_token 长度不足");
    }
    parts.push(remain.slice(pos, end));
    remain = remain.slice(end);
  }
  return parts.join("");
}

function iterSourceEntries(apiObj) {
  const out = [];
  const seen = new Set();
  const lines = (((apiObj || {}).data || {}).list) || [];

  for (const line of lines) {
    const siteId = String(line.siteId ?? "");
    const lineId = String(line.id ?? "");
    const resData = line.resData;
    if (!resData) {
      continue;
    }

    let arr;
    try {
      arr = JSON.parse(resData);
    } catch {
      continue;
    }
    if (!Array.isArray(arr)) {
      continue;
    }

    for (const item of arr) {
      const flag = String(item.flag ?? "").trim();
      const blob = String(item.url ?? "").trim();
      if (!blob) {
        continue;
      }
      for (const segRaw of blob.split("#")) {
        const seg = segRaw.trim();
        if (!seg) {
          continue;
        }
        let name = "";
        let link = seg;
        const idx = seg.indexOf("$");
        if (idx >= 0) {
          name = seg.slice(0, idx).trim();
          link = seg.slice(idx + 1).trim();
        }
        if (!link || !link.toLowerCase().includes(".m3u8")) {
          continue;
        }
        if (seen.has(link)) {
          continue;
        }
        seen.add(link);
        out.push({
          site_id: siteId,
          line_id: lineId,
          flag,
          name,
          url: link,
        });
      }
    }
  }

  return out;
}

function absoluteUrl(base, maybeRelative) {
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return "";
  }
}

function maybeSubtitleByExt(text) {
  const lower = text.toLowerCase();
  return SUBTITLE_EXTS.some((ext) => lower.includes(ext));
}

function extractSubtitleUrisFromTag(tagLine, baseUrl) {
  const out = [];
  const m = tagLine.match(URI_ATTR_RE);
  if (!m) {
    return out;
  }
  const uri = m[1].trim();
  const abs = absoluteUrl(baseUrl, uri);
  if (!abs) {
    return out;
  }
  const lowerTag = tagLine.toLowerCase();
  if (maybeSubtitleByExt(uri) || lowerTag.includes("type=subtitles") || lowerTag.includes("subtitles")) {
    out.push(abs);
  }
  return out;
}

async function crawlM3u8(client, rootPlaylist, maxDepth) {
  const subtitles = [];
  const seenSubtitles = new Set();

  const leafPlaylists = [];
  const seenLeafs = new Set();
  const seenPlaylists = new Set();

  const queue = [{ url: rootPlaylist, depth: 0, kind: "media" }];

  while (queue.length > 0) {
    const item = queue.shift();
    if (seenPlaylists.has(item.url)) {
      continue;
    }
    seenPlaylists.add(item.url);

    let body = "";
    try {
      const res = await client.request(item.url, { retries: 3, timeoutMs: 20000 });
      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw new Error(`HTTP ${res.statusCode}`);
      }
      body = res.body;
    } catch {
      if (item.kind === "media" && !seenLeafs.has(item.url)) {
        seenLeafs.add(item.url);
        leafPlaylists.push(item.url);
      }
      continue;
    }

    let hasMediaChild = false;
    const lines = body.split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) {
        continue;
      }

      const lower = line.toLowerCase();
      if (line.startsWith("#")) {
        const fromTag = extractSubtitleUrisFromTag(line, item.url);
        for (const u of fromTag) {
          if (!seenSubtitles.has(u)) {
            seenSubtitles.add(u);
            subtitles.push(u);
          }
          if (M3U8_RE.test(u) && item.depth < maxDepth) {
            queue.push({ url: u, depth: item.depth + 1, kind: "subtitle" });
          }
        }
        continue;
      }

      const abs = absoluteUrl(item.url, line);
      if (!abs) {
        continue;
      }

      if (maybeSubtitleByExt(line)) {
        if (!seenSubtitles.has(abs)) {
          seenSubtitles.add(abs);
          subtitles.push(abs);
        }
        continue;
      }

      if (M3U8_RE.test(lower)) {
        hasMediaChild = true;
        if (item.depth < maxDepth) {
          queue.push({ url: abs, depth: item.depth + 1, kind: "media" });
        }
        continue;
      }
    }

    if (item.kind === "media") {
      if (!hasMediaChild || (hasMediaChild && item.depth >= maxDepth)) {
        if (!seenLeafs.has(item.url)) {
          seenLeafs.add(item.url);
          leafPlaylists.push(item.url);
        }
      }
    }
  }

  return { subtitles, leaf_playlists: leafPlaylists };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const playUrl = normalizePlayUrl(args.playUrl);
  const base = `${playUrl.protocol}//${playUrl.host}`;
  const client = createHttpClient({
    ua: args.ua,
    insecure: args.insecure,
    resolveRules: args.resolveRules,
  });

  const playRes = await client.request(playUrl.toString(), { retries: 4, timeoutMs: 25000 });
  if (playRes.statusCode < 200 || playRes.statusCode >= 300) {
    throw new Error(`play 页请求失败: HTTP ${playRes.statusCode}`);
  }
  const html = playRes.body;

  const videoId = extractHiddenValue(html, "current_id");
  const eToken = extractHiddenValue(html, "e_token");
  const mtype = extractHiddenValue(html, "mtype");
  const token = buildToken(videoId, eToken);

  const apiUrl = new URL("/api/getResN", base);
  apiUrl.searchParams.set("videoId", videoId);
  apiUrl.searchParams.set("mtype", mtype);
  apiUrl.searchParams.set("token", token);

  const apiRes = await client.request(apiUrl.toString(), {
    retries: 4,
    timeoutMs: 25000,
    headers: {
      "x-requested-with": "XMLHttpRequest",
      referer: playUrl.toString(),
    },
  });
  if (apiRes.statusCode < 200 || apiRes.statusCode >= 300) {
    throw new Error(`/api/getResN 请求失败: HTTP ${apiRes.statusCode}`);
  }

  let apiObj;
  try {
    apiObj = JSON.parse(apiRes.body);
  } catch (err) {
    throw new Error(`/api/getResN JSON 解析失败: ${err.message}`);
  }

  const sources = iterSourceEntries(apiObj);
  const subtitleUrls = [];
  const seenSubtitleUrls = new Set();
  const subtitleUrlsBySource = {};

  const finalPlaylists = [];
  const seenFinalPlaylists = new Set();
  const finalPlaylistsBySource = {};

  for (const src of sources) {
    const crawled = await crawlM3u8(client, src.url, args.maxDepth);
    subtitleUrlsBySource[src.url] = crawled.subtitles;
    finalPlaylistsBySource[src.url] = crawled.leaf_playlists;

    for (const sub of crawled.subtitles) {
      if (!seenSubtitleUrls.has(sub)) {
        seenSubtitleUrls.add(sub);
        subtitleUrls.push(sub);
      }
    }
    for (const leaf of crawled.leaf_playlists) {
      if (!seenFinalPlaylists.has(leaf)) {
        seenFinalPlaylists.add(leaf);
        finalPlaylists.push(leaf);
      }
    }
  }

  const output = {
    play_url: playUrl.toString(),
    video_id: videoId,
    mtype,
    token,
    sources,
    final_playlists: finalPlaylists,
    final_playlists_by_source: finalPlaylistsBySource,
    subtitle_urls: subtitleUrls,
    subtitle_urls_by_source: subtitleUrlsBySource,
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error(`[error] ${err.message}`);
  process.exit(1);
});
