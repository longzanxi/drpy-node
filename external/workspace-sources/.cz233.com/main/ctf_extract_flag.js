#!/usr/bin/env node
"use strict";

/**
 * CTF: 提取 czzymovie 播放源与字幕
 * 设计目标：零第三方依赖，仅使用 Node.js 内置模块。
 */

const http = require("http");
const https = require("https");
const zlib = require("zlib");
const { URL } = require("url");
const { extractVariablesFromHtml } = require("./ast_env");

const DEFAULT_ENTRY = "https://www.czzymovie.com/";
const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36";

function parseArgs(argv) {
  const args = {
    entry: DEFAULT_ENTRY,
    movie: "",
    resolve: {},
    insecure: false,
    verbose: false,
    plain: false,
    maxVplay: 6,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--entry" && argv[i + 1]) {
      args.entry = argv[++i];
    } else if (a === "--movie" && argv[i + 1]) {
      args.movie = argv[++i];
    } else if (a === "--resolve" && argv[i + 1]) {
      const pair = argv[++i];
      const p = pair.indexOf("=");
      if (p > 0) {
        const host = pair.slice(0, p).trim().toLowerCase();
        const ip = pair.slice(p + 1).trim();
        if (host && ip) args.resolve[host] = ip;
      }
    } else if (a === "--insecure") {
      args.insecure = true;
    } else if (a === "--verbose") {
      args.verbose = true;
    } else if (a === "--plain") {
      args.plain = true;
    } else if (a === "--max-vplay" && argv[i + 1]) {
      const n = Number(argv[++i]);
      if (Number.isFinite(n) && n > 0) args.maxVplay = Math.floor(n);
    } else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    }
  }
  return args;
}

function printHelp() {
  console.log(`用法:
  node ctf_extract_flag.js [选项]

选项:
  --entry <url>            入口页，默认 https://www.czzymovie.com/
  --movie <url>            直接指定电影页（可跳过入口自动发现）
  --resolve <host=ip>      指定域名解析（可重复），如: --resolve www.czzymovie.com=198.18.0.186（以 nslookup 为准）
  --insecure               忽略 TLS 证书校验（本地 CTF 常用）
  --max-vplay <n>          最多处理多少个 v_play 链接，默认 6
  --verbose                输出调试日志
  --plain                  仅输出“播放源/字幕”两段文本（方便提交）
  --help                   显示帮助
`);
}

class CookieJar {
  constructor() {
    this.hostCookies = new Map(); // host -> Map(name,value)
  }

  setFromHeader(host, setCookieHeaders) {
    if (!setCookieHeaders) return;
    const list = Array.isArray(setCookieHeaders)
      ? setCookieHeaders
      : [setCookieHeaders];
    if (!this.hostCookies.has(host)) this.hostCookies.set(host, new Map());
    const map = this.hostCookies.get(host);
    for (const line of list) {
      if (!line || typeof line !== "string") continue;
      const first = line.split(";")[0];
      const p = first.indexOf("=");
      if (p <= 0) continue;
      const name = first.slice(0, p).trim();
      const value = first.slice(p + 1).trim();
      if (name) map.set(name, value);
    }
  }

  getCookieHeader(host) {
    const map = this.hostCookies.get(host);
    if (!map || map.size === 0) return "";
    return [...map.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

class HttpClient {
  constructor(opts) {
    this.resolve = opts.resolve || {};
    this.insecure = !!opts.insecure;
    this.verbose = !!opts.verbose;
    this.jar = new CookieJar();
  }

  log(...args) {
    if (this.verbose) console.error("[debug]", ...args);
  }

  async request(rawUrl, options = {}, redirects = 0) {
    if (redirects > 8) {
      throw new Error(`重定向过多: ${rawUrl}`);
    }
    const u = new URL(rawUrl);
    const isHttps = u.protocol === "https:";
    const lib = isHttps ? https : http;
    const connectHost = this.resolve[u.hostname.toLowerCase()] || u.hostname;
    const headers = Object.assign(
      {
        "User-Agent": DEFAULT_UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
      },
      options.headers || {}
    );
    if (!headers.Host) headers.Host = u.host;
    const cookie = this.jar.getCookieHeader(u.hostname);
    if (cookie && !headers.Cookie) headers.Cookie = cookie;

    const reqOptions = {
      protocol: u.protocol,
      hostname: connectHost,
      port: u.port ? Number(u.port) : isHttps ? 443 : 80,
      method: options.method || "GET",
      path: `${u.pathname}${u.search}`,
      headers,
      timeout: options.timeout || 20000,
    };
    if (isHttps) {
      if (!isIpLiteral(u.hostname)) {
        reqOptions.servername = u.hostname;
      }
      reqOptions.rejectUnauthorized = !this.insecure;
    }

    this.log(reqOptions.method, rawUrl, "->", connectHost);

    const res = await new Promise((resolve, reject) => {
      const req = lib.request(reqOptions, resolve);
      req.on("timeout", () => req.destroy(new Error("请求超时")));
      req.on("error", reject);
      if (options.body) req.write(options.body);
      req.end();
    });

    this.jar.setFromHeader(u.hostname, res.headers["set-cookie"]);

    const status = res.statusCode || 0;
    if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
      const next = new URL(res.headers.location, rawUrl).toString();
      this.log("redirect", status, "=>", next);
      res.resume();
      return this.request(next, options, redirects + 1);
    }

    const reqRange = headers.Range || headers.range;
    const maxBytes =
      typeof options.maxBytes === "number" ? options.maxBytes : 8 * 1024 * 1024;
    // 若请求了 Range 但服务端返回 200，通常意味着 Range 未生效，避免误下载整文件。
    if (reqRange && status === 200) {
      const clen = Number(res.headers["content-length"] || 0);
      if (clen && maxBytes && clen > maxBytes) {
        res.destroy();
        throw new Error(
          `Range not honored (status=200, content-length=${clen}, maxBytes=${maxBytes})`
        );
      }
    }

    const body = await readResponseBody(res, maxBytes);
    return {
      url: rawUrl,
      finalUrl: rawUrl,
      status,
      headers: res.headers,
      body,
    };
  }

  async getText(url, headers = {}, maxBytes = 4 * 1024 * 1024) {
    const r = await this.request(url, { headers, maxBytes });
    return r.body.toString("utf8");
  }

  async getBuffer(url, headers = {}, maxBytes = 8 * 1024 * 1024) {
    const r = await this.request(url, { headers, maxBytes });
    return r.body;
  }

  async head(url, headers = {}) {
    return this.request(url, { method: "HEAD", headers, maxBytes: 64 * 1024 });
  }
}

async function readResponseBody(res, maxBytes) {
  if (maxBytes === 0) {
    res.resume();
    return Buffer.alloc(0);
  }
  const chunks = [];
  const limit = typeof maxBytes === "number" && maxBytes > 0 ? maxBytes : 0;
  let total = 0;
  for await (const c of res) {
    total += c.length;
    if (limit && total > limit) {
      res.destroy();
      throw new Error(`Response body too large (${total} > ${limit})`);
    }
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks);
  const enc = String(res.headers["content-encoding"] || "").toLowerCase();
  // 再做一次校验（防止意外情况导致累计值与实际不一致）。
  if (limit && raw.length > limit) throw new Error(`Response body too large (${raw.length} > ${limit})`);

  let out = raw;
  try {
    if (enc.includes("br")) out = zlib.brotliDecompressSync(raw);
    else if (enc.includes("gzip")) out = zlib.gunzipSync(raw);
    else if (enc.includes("deflate")) out = zlib.inflateSync(raw);
  } catch {
    // 解压失败则按原始数据返回
    out = raw;
  }
  if (limit && out.length > limit) {
    throw new Error(`Response body too large after decode (${out.length} > ${limit})`);
  }
  return out;
}

function isIpLiteral(host) {
  if (!host) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  if (host.includes(":")) return true;
  return false;
}

function absUrl(base, maybeRelative) {
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return "";
  }
}

function htmlDecode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#47;/g, "/")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function extractMovieLinks(html, baseUrl) {
  const list = [];
  const re = /href\s*=\s*["']([^"']*\/movie\/\d+\.html[^"']*)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    list.push(absUrl(baseUrl, htmlDecode(m[1])));
  }
  return uniq(list);
}

function extractVPlayLinks(html, baseUrl) {
  const list = [];
  const re = /href\s*=\s*["']([^"']*\/v_play\/[^"']+\.html[^"']*)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    list.push(absUrl(baseUrl, htmlDecode(m[1])));
  }
  return uniq(list);
}

function extractIframeSrc(html, baseUrl) {
  const re = /<iframe[^>]+src\s*=\s*["']([^"']+)["']/i;
  const m = html.match(re);
  if (!m) return "";
  return absUrl(baseUrl, htmlDecode(m[1]));
}

function extractFinalSourceFromPyHtml(html) {
  const ast = extractVariablesFromHtml(html, ["mysvg", "art"], {
    timeoutMs: 120,
  });
  const astMySvg = typeof ast.values.mysvg === "string" ? ast.values.mysvg.trim() : "";
  const astArt = ast.values.art && typeof ast.values.art === "object" ? ast.values.art : null;
  const astArtUrl = astArt && typeof astArt.url === "string" ? astArt.url.trim() : "";
  const astArtType =
    astArt && typeof astArt.type === "string" ? astArt.type.trim().toLowerCase() : "";

  const srcMatch =
    html.match(/const\s+mysvg\s*=\s*['"]([^'"]+)['"]/i) ||
    html.match(/art\.url\s*=\s*['"]([^'"]+)['"]/i);
  const typeMatch =
    html.match(/art\.type\s*=\s*['"]([^'"]+)['"]/i) ||
    html.match(/art\.type\s*=\s*"([^"]+)"/i);
  return {
    sourceUrl: astMySvg || astArtUrl || (srcMatch ? srcMatch[1].trim() : ""),
    sourceType: astArtType || (typeMatch ? typeMatch[1].trim().toLowerCase() : ""),
    inlineSubtitleUrls: uniq(
      [...html.matchAll(/https?:\/\/[^\s"'<>]+\.(?:vtt|srt|ass)/gi)].map(
        (x) => x[0]
      )
    ),
  };
}

function parseM3u8Attributes(line) {
  const out = {};
  const p = line.indexOf(":");
  if (p < 0) return out;
  const rest = line.slice(p + 1);
  // KEY=VALUE，其中 VALUE 可能是带逗号的引号内容
  const re = /([A-Z0-9-]+)=("([^"]*)"|[^,]*)/gi;
  let m;
  while ((m = re.exec(rest))) {
    const k = m[1].toUpperCase();
    const v = (m[3] !== undefined ? m[3] : m[2]).trim();
    out[k] = v;
  }
  return out;
}

async function scanM3u8Subtitles(client, m3u8Url, depth = 1, visited = new Set()) {
  if (!m3u8Url || visited.has(m3u8Url)) {
    return { subtitles: [], nestedPlaylists: [] };
  }
  visited.add(m3u8Url);
  let text = "";
  try {
    text = await client.getText(m3u8Url, { Accept: "*/*" });
  } catch {
    return { subtitles: [], nestedPlaylists: [] };
  }

  const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  const subtitles = [];
  const nestedPlaylists = [];

  for (const line of lines) {
    if (/^#EXT-X-MEDIA:/i.test(line) && /TYPE=SUBTITLES/i.test(line)) {
      const attrs = parseM3u8Attributes(line);
      if (attrs.URI) {
        subtitles.push(absUrl(m3u8Url, attrs.URI));
      }
    } else if (!line.startsWith("#")) {
      if (/\.(vtt|srt|ass)(\?|$)/i.test(line)) {
        subtitles.push(absUrl(m3u8Url, line));
      } else if (/\.m3u8(\?|$)/i.test(line)) {
        nestedPlaylists.push(absUrl(m3u8Url, line));
      }
    }
  }

  const subList = uniq(subtitles);
  if (depth <= 0) {
    return { subtitles: subList, nestedPlaylists: uniq(nestedPlaylists) };
  }
  for (const p of uniq(nestedPlaylists).slice(0, 8)) {
    const child = await scanM3u8Subtitles(client, p, depth - 1, visited);
    subList.push(...child.subtitles);
  }
  return { subtitles: uniq(subList), nestedPlaylists: uniq(nestedPlaylists) };
}

function readU32(buf, off) {
  if (off + 4 > buf.length) return 0;
  return buf.readUInt32BE(off);
}

function readAscii(buf, off, len) {
  if (off + len > buf.length) return "";
  return buf.toString("ascii", off, off + len);
}

function parseBoxes(buf, start = 0, end = buf.length) {
  const boxes = [];
  let p = start;
  while (p + 8 <= end) {
    let size = readU32(buf, p);
    const type = readAscii(buf, p + 4, 4);
    let headerSize = 8;
    if (size === 1) {
      if (p + 16 > end) break;
      const hi = readU32(buf, p + 8);
      const lo = readU32(buf, p + 12);
      const n = hi * 0x100000000 + lo;
      if (!Number.isFinite(n) || n <= 16) break;
      size = n;
      headerSize = 16;
    } else if (size === 0) {
      size = end - p;
    }
    if (size < headerSize || p + size > end) break;
    boxes.push({
      type,
      start: p,
      size,
      headerSize,
      contentStart: p + headerSize,
      contentEnd: p + size,
    });
    p += size;
  }
  return boxes;
}

function findBoxInBuffer(buf, type) {
  const needle = Buffer.from(type, "ascii");
  let idx = buf.indexOf(needle);
  while (idx !== -1) {
    if (idx >= 4) {
      const start = idx - 4;
      const boxType = readAscii(buf, start + 4, 4);
      if (boxType === type) {
        let size = readU32(buf, start);
        let headerSize = 8;
        if (size === 1) {
          if (start + 16 <= buf.length) {
            const hi = readU32(buf, start + 8);
            const lo = readU32(buf, start + 12);
            const big = (BigInt(hi) << 32n) | BigInt(lo);
            if (big <= BigInt(Number.MAX_SAFE_INTEGER)) {
              size = Number(big);
              headerSize = 16;
            } else {
              size = 0;
            }
          } else {
            size = 0;
          }
        } else if (size === 0) {
          size = buf.length - start;
        }
        if (size >= headerSize && start + size <= buf.length) {
          return {
            type,
            start,
            size,
            headerSize,
            contentStart: start + headerSize,
            contentEnd: start + size,
          };
        }
      }
    }
    idx = buf.indexOf(needle, idx + 1);
  }
  return null;
}

function findFirstChildBox(buf, parent, type) {
  const children = parseBoxes(buf, parent.contentStart, parent.contentEnd);
  return children.find((b) => b.type === type) || null;
}

function extractPrintableStrings(buf, minLen = 4) {
  const out = [];
  let cur = [];
  for (let i = 0; i < buf.length; i++) {
    const c = buf[i];
    if (c >= 0x20 && c <= 0x7e) {
      cur.push(c);
    } else {
      if (cur.length >= minLen) out.push(Buffer.from(cur).toString("ascii"));
      cur = [];
    }
  }
  if (cur.length >= minLen) out.push(Buffer.from(cur).toString("ascii"));
  return out;
}

function cleanSubtitleTextHints(list) {
  const keyword = /(credits|subtitle|captions?|scene\s*\d+)/i;
  return uniq(list.map((s) => (s || "").trim()))
    .filter(Boolean)
    .filter((s) => s.length >= 3 && s.length <= 80)
    .filter((s) => !/^(ftyp|isom|free|mdat|moov|trak|mdia|minf|stbl|stsd|encd)/i.test(s))
    .filter((s) => !/handler$/i.test(s))
    .filter((s) => !/(.)\1{6,}/.test(s))
    .filter((s) => {
      const asciiOnly = /^[\x20-\x7E]+$/.test(s);
      if (!asciiOnly) return true;
      const letters = (s.match(/[A-Za-z]/g) || []).length;
      if (letters < 2) return false;
      if (/[^A-Za-z0-9 \-_'".,!?():;]/.test(s)) return false;
      // 只保留更像字幕文本的英文：关键词 / 含空格
      return keyword.test(s) || /\s/.test(s);
    })
    .filter((s) => keyword.test(s) || /\s/.test(s) || /[\u4e00-\u9fff]/.test(s));
}

async function inspectMp4SubtitleHints(client, mp4Url) {
  const hints = {
    hasSubtitleTrack: false,
    subtitleTrackHandlers: [],
    subtitleSampleFormats: [],
    textHints: [],
    note: "",
  };
  const wantText = (s) =>
    /(credits|subtitle|captions?|scene\s*\d+)/i.test(s) || /[\u4e00-\u9fff]/.test(s);

  let size = 0;
  try {
    const h = await client.head(mp4Url, { Accept: "*/*" });
    size = Number(h.headers["content-length"] || 0);
  } catch {
    // ignore
  }

  const fetchRange = async (range, maxBytes) => {
    try {
      const r = await client.request(mp4Url, {
        headers: { Range: range, Accept: "*/*" },
        maxBytes,
      });
      return r.body;
    } catch {
      return Buffer.alloc(0);
    }
  };

  let head = Buffer.alloc(0);
  try {
    head = await fetchRange("bytes=0-2097151", 3 * 1024 * 1024);
  } catch {
    hints.note = "无法读取 mp4 头部范围";
    return hints;
  }

  // 从尾部抓取，逐步扩大窗口，直到找到完整 moov box。
  const tailSizes = [2, 8, 32].map((m) => m * 1024 * 1024);
  let moovSlice = Buffer.alloc(0);
  for (const n of tailSizes) {
    let tail = await fetchRange(`bytes=-${n}`, n + 256 * 1024);
    if (!tail.length && size > n) {
      const st = Math.max(0, size - n);
      tail = await fetchRange(`bytes=${st}-${size - 1}`, n + 256 * 1024);
    }
    if (!tail.length) continue;
    const moovBox = findBoxInBuffer(tail, "moov");
    if (moovBox) {
      moovSlice = tail.subarray(moovBox.start, moovBox.start + moovBox.size);
      break;
    }
  }

  if (!moovSlice.length) {
    // 头部也尝试一次（若 faststart）
    const moovBox = findBoxInBuffer(head, "moov");
    if (moovBox) {
      moovSlice = head.subarray(moovBox.start, moovBox.start + moovBox.size);
    }
  }

  if (!moovSlice.length) {
    hints.note = "未在采样范围内找到完整 moov（可能 moov 很大或 Range 不可用）";
  } else {
    const moov = {
      contentStart: 8, // moov 标准 header=8（size+type），64-bit size 在这里不处理（已在 findBoxInBuffer 兜底）
      contentEnd: moovSlice.length,
    };
    // 若 moov 为 64-bit size，headerSize=16；用 findBoxInBuffer 结果更稳，这里再探测一次。
    const box0 = readU32(moovSlice, 0);
    if (box0 === 1 && moovSlice.length >= 16) moov.contentStart = 16;

    const tracks = parseBoxes(moovSlice, moov.contentStart, moov.contentEnd).filter(
      (b) => b.type === "trak"
    );
    for (const trak of tracks) {
      const mdia = findFirstChildBox(moovSlice, trak, "mdia");
      if (!mdia) continue;
      const hdlr = findFirstChildBox(moovSlice, mdia, "hdlr");
      let handler = "";
      if (hdlr && hdlr.contentStart + 12 <= hdlr.contentEnd) {
        handler = readAscii(moovSlice, hdlr.contentStart + 8, 4);
      }
      const minf = findFirstChildBox(moovSlice, mdia, "minf");
      let sampleFormat = "";
      if (minf) {
        const stbl = findFirstChildBox(moovSlice, minf, "stbl");
        if (stbl) {
          const stsd = findFirstChildBox(moovSlice, stbl, "stsd");
          if (stsd && stsd.contentStart + 16 <= stsd.contentEnd) {
            sampleFormat = readAscii(moovSlice, stsd.contentStart + 12, 4);
          }
        }
      }
      const isSub =
        ["text", "sbtl", "subt", "clcp", "meta"].includes(handler) ||
        ["tx3g", "wvtt", "stpp", "sbtl", "subt", "text"].includes(sampleFormat);
      if (isSub) {
        hints.hasSubtitleTrack = true;
        if (handler) hints.subtitleTrackHandlers.push(handler);
        if (sampleFormat) hints.subtitleSampleFormats.push(sampleFormat);
      }
    }
  }

  // 字幕文本回退：在 head + moovSlice 中做关键字扫描（避免扫完整 mdat）。
  const rawTextHints = [];
  rawTextHints.push(
    ...extractPrintableStrings(head, 4).filter((s) => wantText(s))
  );
  if (moovSlice.length) {
    rawTextHints.push(
      ...extractPrintableStrings(moovSlice, 4).filter((s) => wantText(s))
    );
  }
  hints.textHints.push(...rawTextHints);

  hints.subtitleTrackHandlers = uniq(hints.subtitleTrackHandlers);
  hints.subtitleSampleFormats = uniq(hints.subtitleSampleFormats);
  hints.textHints = cleanSubtitleTextHints(hints.textHints).slice(0, 40);
  return hints;
}

async function discoverMovieUrl(client, entryUrl) {
  const html = await client.getText(entryUrl);
  const movies = extractMovieLinks(html, entryUrl);
  if (!movies.length) {
    throw new Error(`入口页未发现 movie 链接: ${entryUrl}`);
  }
  return movies[0];
}

async function run() {
  const args = parseArgs(process.argv);
  const client = new HttpClient({
    resolve: args.resolve,
    insecure: args.insecure,
    verbose: args.verbose,
  });

  const result = {
    entry: args.entry,
    movie: "",
    vplayCount: 0,
    items: [],
    allPlaybackSources: [],
    allSubtitles: [],
    timestamp: new Date().toISOString(),
  };

  const movieUrl = args.movie || (await discoverMovieUrl(client, args.entry));
  result.movie = movieUrl;

  const movieHtml = await client.getText(movieUrl);
  const vplays = extractVPlayLinks(movieHtml, movieUrl).slice(0, args.maxVplay);
  result.vplayCount = vplays.length;
  if (!vplays.length) {
    throw new Error(`电影页未发现 v_play 链接: ${movieUrl}`);
  }

  for (const vplayUrl of vplays) {
    const item = {
      vplayUrl,
      iframeUrl: "",
      finalSourceType: "",
      finalSourceUrl: "",
      externalSubtitles: [],
      mp4SubtitleHints: null,
      subtitleTexts: [],
    };
    try {
      const vhtml = await client.getText(vplayUrl);
      const iframe = extractIframeSrc(vhtml, vplayUrl);
      item.iframeUrl = iframe;
      if (!iframe) {
        result.items.push(item);
        continue;
      }
      const vplayOrigin = new URL(vplayUrl).origin;
      const phtml = await client.getText(iframe, {
        Referer: `${vplayOrigin}/`,
      });
      const parsed = extractFinalSourceFromPyHtml(phtml);
      item.finalSourceUrl = parsed.sourceUrl;
      item.finalSourceType = parsed.sourceType;
      item.externalSubtitles.push(...parsed.inlineSubtitleUrls);

      // 兜底：有些情况下 py.php 返回被裁剪，但 iframe 参数里仍有明文直链。
      if (!item.finalSourceUrl) {
        try {
          const q = new URL(iframe).searchParams.get("url") || "";
          if (/^https?:\/\//i.test(q)) {
            item.finalSourceUrl = q;
            if (/\.m3u8(\?|$)/i.test(q)) item.finalSourceType = "hls";
            if (/\.mp4(\?|$)/i.test(q)) item.finalSourceType = "mp4";
          }
        } catch {
          // ignore
        }
      }

      if (item.finalSourceUrl) {
        const lower = item.finalSourceUrl.toLowerCase();
        const looksM3u8 = lower.includes(".m3u8") || item.finalSourceType === "hls";
        const looksMp4 = lower.includes(".mp4") || item.finalSourceType === "mp4";

        if (looksM3u8) {
          const m3u8Subs = await scanM3u8Subtitles(client, item.finalSourceUrl, 2);
          item.externalSubtitles.push(...m3u8Subs.subtitles);
        }
        if (looksMp4) {
          item.mp4SubtitleHints = await inspectMp4SubtitleHints(client, item.finalSourceUrl);
          if (item.mp4SubtitleHints && item.mp4SubtitleHints.textHints.length) {
            item.subtitleTexts.push(...item.mp4SubtitleHints.textHints);
          }
        }
      }
      item.externalSubtitles = uniq(item.externalSubtitles);
      item.subtitleTexts = uniq(item.subtitleTexts);
    } catch (e) {
      item.error = String(e && e.message ? e.message : e);
    }
    result.items.push(item);
  }

  result.allPlaybackSources = uniq(result.items.map((x) => x.finalSourceUrl).filter(Boolean));
  result.allSubtitles = uniq(
    result.items.flatMap((x) => [
      ...(x.externalSubtitles || []),
      ...(x.subtitleTexts || []),
    ])
  );

  if (args.plain) {
    console.log("PLAYBACK_SOURCES");
    for (const u of result.allPlaybackSources) console.log(u);
    console.log("");
    console.log("SUBTITLES");
    for (const s of result.allSubtitles) console.log(s);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

run().catch((err) => {
  console.error("[fatal]", err && err.stack ? err.stack : err);
  process.exit(1);
});
