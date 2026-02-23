#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * CTF: 从 libvio 站点解析“最终播放源 + 全部字幕(若存在)”
 *
 * 设计目标：
 * - 尽量少依赖：只用 Node.js 内置模块
 * - 可从 play 页直接解析；也可从 libvio.app 起步自动发现可用源站并扫描
 *
 * 说明：
 * - 默认 `--insecure`（忽略 HTTPS 证书错误），更贴合本地 CTF 环境；如需严格校验用 `--secure`
 */

const http = require('node:http');
const https = require('node:https');
const zlib = require('node:zlib');
const { URL } = require('node:url');
const { extractSingleVariableFromHtml } = require('./ast_env');

// 缓存：避免扫描时重复拉 player js
const _playerJsSrcCache = new Map(); // key: `${origin}|${from}` => srcExpr(string) | null

function parseArgs(argv) {
  const out = {
    start: 'https://www.libvio.app/',
    origin: '',
    play: '',
    scan: false,
    scanDeep: false,
    maxDetails: 40,
    maxPlays: 120,
    showSeeds: 6,
    showPages: 30,
    showTail: false,
    concurrency: 8,
    retries: 2,
    retryDelayMs: 350,
    mp4Probe: true,
    scanMp4Probe: false,
    insecure: true,
    json: false,
    verbose: false,
    resolve: new Map(), // key: host:port, val: ip/host
  };

  const args = [...argv];
  while (args.length) {
    const a = args.shift();
    if (a === '--start') out.start = args.shift() || out.start;
    else if (a === '--origin') out.origin = args.shift() || '';
    else if (a === '--play') out.play = args.shift() || '';
    else if (a === '--scan') out.scan = true;
    else if (a === '--scan-deep') out.scanDeep = true;
    else if (a === '--max-details') out.maxDetails = Number(args.shift() || out.maxDetails);
    else if (a === '--max-plays') out.maxPlays = Number(args.shift() || out.maxPlays);
    else if (a === '--show-seeds') out.showSeeds = Number(args.shift() || out.showSeeds);
    else if (a === '--show-pages') out.showPages = Number(args.shift() || out.showPages);
    else if (a === '--show-tail') out.showTail = true;
    else if (a === '--concurrency') out.concurrency = Number(args.shift() || out.concurrency);
    else if (a === '--retries') out.retries = Number(args.shift() || out.retries);
    else if (a === '--retry-delay') out.retryDelayMs = Number(args.shift() || out.retryDelayMs);
    else if (a === '--scan-mp4-probe') out.scanMp4Probe = true;
    else if (a === '--no-mp4-probe') out.mp4Probe = false;
    else if (a === '--resolve') {
      const v = args.shift() || '';
      // 兼容 curl --resolve 形式：host:port:ip
      const m = v.match(/^([^:]+):(\d+):(.+)$/);
      if (!m) throw new Error(`--resolve 参数格式应为 host:port:ip，实际: ${v}`);
      out.resolve.set(`${m[1]}:${m[2]}`, m[3]);
    } else if (a === '--secure') out.insecure = false;
    else if (a === '--insecure') out.insecure = true;
    else if (a === '--json') out.json = true;
    else if (a === '--verbose') out.verbose = true;
    else if (a === '-h' || a === '--help') {
      out.help = true;
    } else {
      throw new Error(`未知参数: ${a}`);
    }
  }
  return out;
}

function buildDefaultHeaders(extra = {}) {
  return {
    'User-Agent':
      extra['User-Agent'] ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    Connection: 'keep-alive',
    ...extra,
  };
}

function decodeBody(buf, enc) {
  const e = (enc || '').toLowerCase();
  if (!buf || buf.length === 0) return Buffer.alloc(0);
  if (e.includes('br')) return zlib.brotliDecompressSync(buf);
  if (e.includes('gzip')) return zlib.gunzipSync(buf);
  if (e.includes('deflate')) return zlib.inflateSync(buf);
  return buf;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryStatus(status) {
  // 兼容 CTF 里常见的网关/风控临时状态码
  return [408, 425, 429, 500, 502, 503, 504, 512, 513].includes(Number(status || 0));
}

async function requestBytes(url, opts) {
  const {
    method = 'GET',
    headers = {},
    timeoutMs = 20000,
    maxRedirects = 6,
    retries = 2,
    retryDelayMs = 350,
    insecure = true,
    resolve = new Map(),
    referer = '',
  } = opts || {};

  const u = typeof url === 'string' ? new URL(url) : url;
  const isHttps = u.protocol === 'https:';
  const lib = isHttps ? https : http;
  const port = u.port ? Number(u.port) : isHttps ? 443 : 80;
  const host = u.hostname;
  const resolved = resolve.get(`${host}:${port}`) || host;

  const reqHeaders = {
    ...buildDefaultHeaders(),
    ...(referer ? { Referer: referer } : {}),
    ...headers,
    Host: host, // 保持原 Host，避免服务端按 Host/Referer 校验
  };

  const options = {
    protocol: u.protocol,
    hostname: resolved,
    port,
    path: `${u.pathname}${u.search}`,
    method,
    headers: reqHeaders,
    timeout: timeoutMs,
  };

  if (isHttps) {
    options.servername = host; // TLS SNI
    options.rejectUnauthorized = !insecure;
  }

  let res;
  try {
    res = await new Promise((resolvePromise, rejectPromise) => {
      const req = lib.request(options, (res0) => resolvePromise(res0));
      req.on('timeout', () => {
        req.destroy(new Error(`timeout after ${timeoutMs}ms: ${u.href}`));
      });
      req.on('error', rejectPromise);
      req.end();
    });
  } catch (e) {
    if (retries > 0) {
      const backoff = retryDelayMs * (1 + (2 - Math.min(retries, 2)));
      await sleep(backoff);
      return requestBytes(u, { method, headers, timeoutMs, maxRedirects, retries: retries - 1, retryDelayMs, insecure, resolve, referer });
    }
    throw e;
  }

  const chunks = [];
  for await (const c of res) chunks.push(c);
  const raw = Buffer.concat(chunks);
  const body = decodeBody(raw, res.headers['content-encoding']);

  // redirect
  if (
    res.statusCode &&
    [301, 302, 303, 307, 308].includes(res.statusCode) &&
    res.headers.location &&
    maxRedirects > 0
  ) {
    const loc = new URL(res.headers.location, u);
    const nextMethod = res.statusCode === 303 ? 'GET' : method;
    return requestBytes(loc, {
      method: nextMethod,
      headers,
      timeoutMs,
      maxRedirects: maxRedirects - 1,
      retries,
      retryDelayMs,
      insecure,
      resolve,
      referer,
    });
  }

  // 某些节点会临时返回 5xx/512/513，做一次退避重试，降低漏检
  if (res.statusCode && shouldRetryStatus(res.statusCode) && retries > 0) {
    const backoff = retryDelayMs * (1 + (2 - Math.min(retries, 2)));
    await sleep(backoff);
    return requestBytes(u, { method, headers, timeoutMs, maxRedirects, retries: retries - 1, retryDelayMs, insecure, resolve, referer });
  }

  return {
    url: u.href,
    status: res.statusCode || 0,
    headers: res.headers,
    body,
  };
}

async function requestText(url, opts) {
  const r = await requestBytes(url, opts);
  // 这里简单按 UTF-8 解码；站内基本是 UTF-8
  const text = r.body.toString('utf8');
  return { ...r, text };
}

function extractJsObject(html, marker) {
  const idx = html.indexOf(marker);
  if (idx < 0) return null;
  const start = html.indexOf('{', idx);
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let strCh = '';
  let esc = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inStr) {
      if (esc) {
        esc = false;
      } else if (ch === '\\') {
        esc = true;
      } else if (ch === strCh) {
        inStr = false;
        strCh = '';
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = true;
      strCh = ch;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  return null;
}

function base64DecodeMaybeUrlSafe(s) {
  const fixed = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(fixed, 'base64').toString('utf8');
}

function decryptPlayerData(p) {
  if (!p || typeof p !== 'object') return p;
  const enc = Number(p.encrypt);
  if (enc === 1) {
    if (typeof p.url === 'string') p.url = unescape(p.url);
    if (typeof p.url_next === 'string') p.url_next = unescape(p.url_next);
  } else if (enc === 2) {
    if (typeof p.url === 'string') p.url = unescape(base64DecodeMaybeUrlSafe(p.url));
    if (typeof p.url_next === 'string') p.url_next = unescape(base64DecodeMaybeUrlSafe(p.url_next));
  }
  return p;
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function b64Pad(s) {
  const str = String(s || '');
  return str + '='.repeat((4 - (str.length % 4)) % 4);
}

function ty4TokenReplaceExt(origToken, newExt3) {
  // ty4 的 url token: base64(binary + asciiHexTail). asciiHexTail 内含文件名的 hex 编码，如 ...2E6D7034... (".mp4")
  const ext = String(newExt3 || '').toLowerCase();
  if (!/^[a-z0-9]{3}$/.test(ext)) return '';
  const extHex = Buffer.from(ext, 'ascii').toString('hex').toUpperCase(); // e.g. srt => 737274

  let buf;
  try {
    buf = Buffer.from(b64Pad(origToken), 'base64');
  } catch {
    return '';
  }
  const s = buf.toString('latin1');
  const m = s.match(/([0-9A-F]{40,})$/);
  if (!m) return '';
  const tail = m[1];
  const start = s.length - tail.length;
  const newTail = tail.replace(/6D7034/i, extHex); // mp4 -> ext
  if (newTail === tail) return '';
  const outBuf = Buffer.from(buf);
  outBuf.write(newTail, start, 'latin1');
  return outBuf.toString('base64').replace(/=+$/g, '');
}

function absUrl(base, maybeRelative) {
  if (!maybeRelative) return '';
  try {
    return new URL(maybeRelative, base).href;
  } catch {
    return '';
  }
}

function parseVarString(html, varName) {
  // 支持：var vid = '...';  let urls = "..."
  const r = new RegExp(`\\b(?:var|let|const)\\s+${varName}\\s*=\\s*(['\\\"])([\\s\\S]*?)\\1\\s*;`);
  const m = html.match(r);
  return m ? m[2] : '';
}

function parseAllUrls(html) {
  const re = /https?:\/\/[^"'<> \t\r\n]+/g;
  return uniq(html.match(re) || []);
}

function parseSubtitleLikeStrings(text, baseUrl) {
  const re = /(?:(?:https?:)?\/\/|\/)[^"'<> \t\r\n]+?\.(?:vtt|srt|ass|ssa|sub)(?:\?[^"'<> \t\r\n]*)?/gi;
  const ms = text.match(re) || [];
  const out = [];
  for (const m of ms) {
    const u = m.startsWith('//') ? `https:${m}` : m;
    out.push(absUrl(baseUrl, u));
  }
  return uniq(out);
}

function looksLikeSubtitleUrl(u) {
  if (!u) return false;
  if (/\.(vtt|srt|ass|ssa|sub)(\?|$)/i.test(u)) return true;
  if (/subtitle|captions/i.test(u)) return true;
  // 部分直链把真实文件名放在 query（如 filename=xx.srt 或 file=xx.vtt）
  try {
    const U = new URL(u);
    for (const k of ['filename', 'file', 'name']) {
      const v = U.searchParams.get(k);
      if (v && /\.(vtt|srt|ass|ssa|sub)$/i.test(v)) return true;
    }
  } catch {
    // ignore
  }
  return /(?:filename|file|name)=[^&]*\.(?:vtt|srt|ass|ssa|sub)(?:&|$)/i.test(u);
}

function looksLikeHls(u) {
  if (!u) return false;
  if (/\.m3u8(\?|$)/i.test(u)) return true;
  try {
    const U = new URL(u);
    const fn = U.searchParams.get('filename') || U.searchParams.get('file') || '';
    if (fn && /\.m3u8$/i.test(fn)) return true;
  } catch {
    // ignore
  }
  return /(?:filename|file)=[^&]*\.m3u8(?:&|$)/i.test(u);
}

function looksLikeMp4(u) {
  if (!u) return false;
  if (/\.mp4(\?|$)/i.test(u)) return true;
  try {
    const U = new URL(u);
    const fn = U.searchParams.get('filename') || U.searchParams.get('file') || '';
    if (fn && /\.mp4$/i.test(fn)) return true;
    const mt = U.searchParams.get('mime_type') || U.searchParams.get('mime') || '';
    if (mt && /video[_/.-]?mp4/i.test(mt)) return true;
  } catch {
    // ignore
  }
  return /(?:filename|file)=[^&]*\.mp4(?:&|$)/i.test(u) || /mime(?:_type)?=video[_%2f.-]*mp4/i.test(u);
}

function looksLikeMediaUrl(u) {
  if (!u) return false;
  if (looksLikeHls(u) || looksLikeMp4(u)) return true;
  if (/\.(mpd|flv)(\?|$)/i.test(u)) return true;
  try {
    const U = new URL(u);
    const fn = U.searchParams.get('filename') || U.searchParams.get('file') || '';
    if (fn && /\.(mpd|flv)$/i.test(fn)) return true;
  } catch {
    // ignore
  }
  return /(?:filename|file)=[^&]*\.(?:mpd|flv)(?:&|$)/i.test(u);
}

function pickBestMediaUrl(urls) {
  const cands = (urls || []).filter((u) => looksLikeMediaUrl(u));
  const score = (u) => {
    const lu = u.toLowerCase();
    if (lu.includes('.m3u8')) return 4000 + u.length;
    if (lu.includes('.mpd')) return 3000 + u.length;
    if (lu.includes('.mp4')) return 2000 + u.length;
    if (lu.includes('.flv')) return 1000 + u.length;
    if (lu.includes('mime_type=video_mp4') || lu.includes('mime=video_mp4')) return 2000 + u.length;
    return u.length;
  };
  cands.sort((a, b) => score(b) - score(a));
  return cands[0] || '';
}

function parseM3u8ForVariants(m3u8Text, manifestUrl) {
  const lines = m3u8Text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const variants = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.startsWith('#EXT-X-STREAM-INF:')) continue;
    const attrs = l.slice('#EXT-X-STREAM-INF:'.length);
    const next = lines[i + 1] || '';
    const bwM = attrs.match(/BANDWIDTH=(\d+)/i);
    const resM = attrs.match(/RESOLUTION=(\d+)x(\d+)/i);
    const bw = bwM ? Number(bwM[1]) : 0;
    const w = resM ? Number(resM[1]) : 0;
    const h = resM ? Number(resM[2]) : 0;
    const u = next && !next.startsWith('#') ? absUrl(manifestUrl, next) : '';
    if (u) variants.push({ url: u, bandwidth: bw, width: w, height: h, raw: attrs });
  }
  // 优先分辨率，其次码率
  variants.sort((a, b) => (b.height - a.height) || (b.bandwidth - a.bandwidth));
  return variants;
}

function parseM3u8ForSubtitleTracks(m3u8Text, manifestUrl) {
  const out = [];
  const lines = m3u8Text.split(/\r?\n/);
  for (const line0 of lines) {
    const line = line0.trim();
    if (!line) continue;
    if (looksLikeSubtitleUrl(line)) {
      out.push(absUrl(manifestUrl, line));
      continue;
    }
    if (!line.startsWith('#EXT-X-MEDIA:')) continue;
    if (!/TYPE=SUBTITLES/i.test(line)) continue;
    const m = line.match(/URI=\"([^\"]+)\"/i);
    if (m) out.push(absUrl(manifestUrl, m[1]));
  }
  return uniq(out);
}

async function headStatus(url, opts) {
  const r = await requestBytes(url, { ...(opts || {}), method: 'HEAD', maxRedirects: 4 });
  return { url: r.url, status: r.status, headers: r.headers };
}

function buildSubtitleCandidatesForMedia(mediaUrl) {
  let u;
  try {
    u = new URL(mediaUrl);
  } catch {
    return [];
  }

  const path = u.pathname;
  const lastSlash = path.lastIndexOf('/');
  const dir = lastSlash >= 0 ? path.slice(0, lastSlash + 1) : '/';
  const file = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
  const m = file.match(/^(.*)\.([^.]+)$/);
  if (!m) return [];
  const name = m[1];

  const originDir = `${u.origin}${dir}`;
  const base = `${originDir}${name}`;
  const q = u.search || '';

  // 控制候选规模：大多数站只会放这几类外挂字幕
  const exts = ['.srt', '.ass', '.vtt', '.ssa', '.sub'];
  const langs = ['', '.zh', '.zh-CN', '.chs', '.en'];

  const cands = [];
  for (const lang of langs) {
    for (const ext of exts) {
      cands.push(`${base}${lang}${ext}`);
    }
  }

  // 常见子目录
  for (const subDir of ['sub', 'subs', 'subtitle', 'subtitles']) {
    for (const ext of ['.srt', '.ass', '.vtt', '.ssa', '.sub']) {
      cands.push(`${originDir}${subDir}/${name}${ext}`);
    }
  }

  return uniq(cands);
}

async function getPlayerJsSrcExpr(origin, from, opts) {
  const key = `${origin}|${from}`;
  if (_playerJsSrcCache.has(key)) return _playerJsSrcCache.get(key);

  const jsUrl = absUrl(origin, `/static/player/${from}.js`);
  try {
    const r = await requestText(jsUrl, { insecure: opts.insecure, resolve: opts.resolve, timeoutMs: 15000 });
    if (r.status !== 200) {
      _playerJsSrcCache.set(key, null);
      return null;
    }
    // 常见形态：src="...MacPlayer.PlayUrl..."
    const m = r.text.match(/\bsrc=(['"])(.*?)\1/i);
    const expr = m ? m[2] : null;
    _playerJsSrcCache.set(key, expr);
    return expr;
  } catch {
    _playerJsSrcCache.set(key, null);
    return null;
  }
}

function renderSrcExpr(expr, ctx) {
  // expr 示例：
  //   /vid/yd.php?url='+MacPlayer.PlayUrl+'&next='+MacPlayer.PlayLinkNext+'&id='+MacPlayer.Id+'&nid='+MacPlayer.Nid+'
  //   https://host:9091'+MacPlayer.PlayUrl+'
  if (!expr) return '';
  let s = String(expr);
  // 去掉末尾多余的 +'
  s = s.replace(/\+\'\s*$/g, '');

  const repl = (name, value) => {
    // 覆盖多种边界：'+MacPlayer.X+', '+MacPlayer.X, MacPlayer.X+'
    const v = value == null ? '' : String(value);
    s = s.replace(new RegExp(`'\\+MacPlayer\\.${name}\\+'`, 'g'), v);
    s = s.replace(new RegExp(`'\\+MacPlayer\\.${name}`, 'g'), v);
    s = s.replace(new RegExp(`MacPlayer\\.${name}\\+'`, 'g'), v);
    s = s.replace(new RegExp(`MacPlayer\\.${name}`, 'g'), v);
  };

  repl('PlayUrl', ctx.PlayUrl);
  repl('PlayLinkNext', ctx.PlayLinkNext);
  repl('PlayUrlNext', ctx.PlayUrlNext);
  repl('Id', ctx.Id);
  repl('Nid', ctx.Nid);

  // maccms.path 常见为空，直接按空替换
  s = s.replace(/'\+maccms\.path\+'/gi, '');
  s = s.replace(/maccms\.path/gi, '');
  return s;
}

async function buildIframeUrlFromFrom(origin, from, player, opts) {
  const expr = await getPlayerJsSrcExpr(origin, from, opts);
  if (!expr) return '';

  // 若是典型的 ?a='+MacPlayer.X&b='+MacPlayer.Y 结构，直接用 URLSearchParams 构造（避免 &/# 打断）
  if (expr.includes('?') && /MacPlayer\.(PlayUrl|Id|Nid)/.test(expr)) {
    const [base0] = expr.split('?', 1);
    const base = absUrl(origin, base0);
    const u = new URL(base);
    const re = /([A-Za-z0-9_]+)='\+MacPlayer\.([A-Za-z0-9_]+)/g;
    for (const m of expr.matchAll(re)) {
      const k = m[1];
      const vname = m[2];
      let v = '';
      if (vname === 'PlayUrl') v = String(player.url || '');
      else if (vname === 'PlayLinkNext') v = String(player.link_next || '');
      else if (vname === 'PlayUrlNext') v = String(player.url_next || '');
      else if (vname === 'Id') v = String(player.id || '');
      else if (vname === 'Nid') v = String(player.nid || '');
      else v = '';
      u.searchParams.set(k, v);
    }
    if ([...u.searchParams.keys()].length) return u.href;
    // 没匹配到键值对就走兜底渲染
  }

  const rendered = renderSrcExpr(expr, {
    PlayUrl: player.url || '',
    PlayLinkNext: player.link_next || '',
    PlayUrlNext: player.url_next || '',
    Id: player.id || '',
    Nid: player.nid || '',
  });
  if (!rendered) return '';
  if (/^https?:\/\//i.test(rendered)) return rendered;
  if (rendered.startsWith('//')) return `https:${rendered}`;
  return absUrl(origin, rendered);
}

async function probeTy4Subtitles(iframeUrl, referer, token, opts) {
  // 通过“改 token 后缀中的文件扩展名”让 ty4.php 去查字幕文件并返回真实地址
  const out = [];
  let base;
  try {
    base = new URL(iframeUrl);
  } catch {
    return out;
  }
  if (!/\/vid\/ty4\.php$/i.test(base.pathname)) return out;

  const exts = ['vtt', 'srt', 'ass', 'ssa', 'sub']; // 常见外挂字幕
  for (const ext of exts) {
    const nt = ty4TokenReplaceExt(token, ext);
    if (!nt) continue;
    const u = new URL(base.href);
    u.searchParams.set('url', nt);
    const r = await requestText(u.href, { insecure: opts.insecure, resolve: opts.resolve, referer, timeoutMs: 20000 });
    if (r.status !== 200) continue;
    const vid = parseVarString(r.text, 'vid');
    if (!vid) continue;
    // 未找到文件名：xxx.xxx
    if (/^\s*未找到文件名[:：]/.test(vid)) continue;
    if (looksLikeSubtitleUrl(vid) || /\.(vtt|srt|ass|ssa|sub)(\?|$)/i.test(vid)) {
      const vv = /^https?:\/\//i.test(vid) ? vid : absUrl(u.href, vid);
      out.push(vv);
    }
  }
  return uniq(out);
}

async function resolveFromPlayPage(playUrl, opts) {
  const { insecure, resolve, verbose } = opts;
  const play = new URL(playUrl);
  const origin = play.origin;

  const pr = await requestText(play.href, { insecure, resolve });
  if (pr.status !== 200) {
    throw new Error(`play 页请求失败: ${pr.status} ${play.href}`);
  }

  let player = extractSingleVariableFromHtml(pr.text, 'player_aaaa', {
    timeoutMs: 120,
  });
  if (!player || typeof player !== 'object') {
    const rawObj = extractJsObject(pr.text, 'var player_aaaa=');
    if (!rawObj) throw new Error(`未找到 player_aaaa: ${play.href}`);
    try {
      player = JSON.parse(rawObj);
    } catch (e) {
      throw new Error(`player_aaaa 不是合法 JSON（可能需要更强解析）: ${e && e.message}`);
    }
  }

  decryptPlayerData(player);

  const from = String(player.from || '');
  const linkNext = typeof player.link_next === 'string' ? player.link_next : '';
  const id = String(player.id || '');
  const nid = String(player.nid || '');
  const url = String(player.url || '');

  const out = {
    play: play.href,
    origin,
    from,
    player,
    master: '',
    source: '',
    subtitles: [],
    debug: {},
  };

  // 兜底：若 url 已经是直链
  const directUrl = url && /^https?:\/\//i.test(url) ? url : '';

  if (from === 'yd189') {
    const yd = new URL('/vid/yd.php', origin);
    yd.searchParams.set('url', url);
    yd.searchParams.set('next', linkNext);
    yd.searchParams.set('id', id);
    yd.searchParams.set('nid', nid);

    const yr = await requestText(yd.href, { insecure, resolve, referer: play.href });
    out.debug.yd = { url: yd.href, status: yr.status };
    if (yr.status !== 200) throw new Error(`yd.php 请求失败: ${yr.status} ${yd.href}`);

    const vid = parseVarString(yr.text, 'vid');
    if (!vid) throw new Error(`yd.php 未解析到 vid: ${yd.href}`);
    out.master = vid;

    // 从 yd.php 页面本身搜一遍字幕直链（有些站会直接塞进页面）
    out.subtitles.push(...parseAllUrls(yr.text).filter(looksLikeSubtitleUrl));
    out.subtitles.push(...parseSubtitleLikeStrings(yr.text, yd.href));

    if (looksLikeHls(vid)) {
      const mr = await requestText(vid, { insecure, resolve, referer: play.href });
      out.debug.masterStatus = mr.status;
      if (mr.status === 200) {
        const variants = parseM3u8ForVariants(mr.text, vid);
        out.debug.variants = variants.slice(0, 6);
        out.subtitles.push(...parseM3u8ForSubtitleTracks(mr.text, vid));
        out.source = variants.length ? variants[0].url : vid;

        // 选中变体后，再扫一次变体 m3u8，看是否有字幕线索
        if (variants.length) {
          const vr = await requestText(variants[0].url, { insecure, resolve, referer: play.href });
          if (vr.status === 200) out.subtitles.push(...parseM3u8ForSubtitleTracks(vr.text, variants[0].url));
        }
      } else {
        out.source = vid;
      }
    } else {
      out.source = vid;
    }
  } else if (from === 'vr2') {
    const vr2 = new URL('/vid/plyr/vr2.php', origin);
    vr2.searchParams.set('url', url);
    vr2.searchParams.set('next', linkNext);
    vr2.searchParams.set('id', id);
    vr2.searchParams.set('nid', nid);

    const vr = await requestText(vr2.href, { insecure, resolve, referer: play.href });
    out.debug.vr2 = { url: vr2.href, status: vr.status };
    if (vr.status !== 200) throw new Error(`vr2.php 请求失败: ${vr.status} ${vr2.href}`);
    const urls = parseVarString(vr.text, 'urls');
    if (!urls) throw new Error(`vr2.php 未解析到 urls: ${vr2.href}`);
    out.source = urls;

    // 页面内字幕直链（如果存在）
    out.subtitles.push(...parseAllUrls(vr.text).filter(looksLikeSubtitleUrl));
    out.subtitles.push(...parseSubtitleLikeStrings(vr.text, vr2.href));
  } else if (from && from !== 'uc' && from !== 'kuake') {
    // 通用 from 处理：读取 /static/player/<from>.js，拿到 iframe 地址，再从 iframe 页提取真实媒体链接
    const iframe = await buildIframeUrlFromFrom(origin, from, player, { insecure, resolve });
    out.debug.generic = { iframe };
    if (iframe) {
      const ir = await requestText(iframe, { insecure, resolve, referer: play.href, timeoutMs: 20000 });
      out.debug.iframeStatus = ir.status;
      if (ir.status === 200) {
        // 1) 优先从常见变量里取
        const v1 = parseVarString(ir.text, 'vid');
        const v2 = parseVarString(ir.text, 'urls');
        const fromVars = [v1, v2].filter((u) => looksLikeMediaUrl(u));
        const urlsAll = parseAllUrls(ir.text);
        const picked = fromVars[0] || pickBestMediaUrl(urlsAll);
        if (picked) {
          const pickedAbs = /^https?:\/\//i.test(picked) ? picked : absUrl(iframe, picked);
          out.master = looksLikeHls(pickedAbs) ? pickedAbs : out.master;
          out.source = pickedAbs;
        }

        // 字幕：既抓绝对链接，也抓相对路径/协议相对
        out.subtitles.push(...urlsAll.filter(looksLikeSubtitleUrl));
        out.subtitles.push(...parseSubtitleLikeStrings(ir.text, iframe));

        // m3u8 的字幕轨
        if (looksLikeHls(out.source)) {
          const mr = await requestText(out.source, { insecure, resolve, referer: play.href, timeoutMs: 20000 });
          if (mr.status === 200) {
            const variants = parseM3u8ForVariants(mr.text, out.source);
            out.debug.variants = variants.slice(0, 6);
            out.subtitles.push(...parseM3u8ForSubtitleTracks(mr.text, out.source));
            out.source = variants.length ? variants[0].url : out.source;
            if (variants.length) {
              const vr = await requestText(out.source, { insecure, resolve, referer: play.href, timeoutMs: 20000 });
              if (vr.status === 200) out.subtitles.push(...parseM3u8ForSubtitleTracks(vr.text, out.source));
            }
          }
        }

        // 特判：ty4.php 的 token 体系可“改扩展名”探测外挂字幕（CTF 常见 keygen 点）
        if (!out.subtitles.length && /\/vid\/ty4\.php(\?|$)/i.test(iframe) && player && typeof player.url === 'string' && player.url) {
          try {
            const subs = await probeTy4Subtitles(iframe, play.href, player.url, { insecure, resolve });
            out.subtitles.push(...subs);
          } catch {
            // ignore
          }
        }
      }
    }
  } else if (directUrl) {
    out.source = directUrl;
  } else {
    // 未支持的 from：保留信息，便于你继续补规则
    out.source = url || '';
    if (verbose) console.error(`[WARN] 未支持的 from=${from}，仅返回 player.url`);
  }

  // 兜底：通用 from 失败时，至少回退到 play 页里的直链（如果有）
  if (!out.source && directUrl) out.source = directUrl;

  // 二次：若是 mp4，尝试猜测 sidecar 字幕文件是否存在
  if (opts.probeMp4Subs !== false && looksLikeMp4(out.source)) {
    const cands = buildSubtitleCandidatesForMedia(out.source);
    const lim = createLimiter(8);
    const hitSet = new Set();
    await Promise.all(
      cands.map((cu) =>
        lim(async () => {
          if (hitSet.size >= 20) return;
          // 只 head，成本低；如果服务端不支持 HEAD，再改成 GET+Range
          // referer 用 play 页，避开 403
          let hs;
          try {
            hs = await headStatus(cu, { insecure, resolve, referer: play.href, timeoutMs: 8000, retries: 0 });
          } catch {
            return;
          }
          const ct = String(hs.headers && hs.headers['content-type'] ? hs.headers['content-type'] : '').toLowerCase();
          if ((hs.status === 200 || hs.status === 206) && !ct.includes('xml')) hitSet.add(hs.url);
        }),
      ),
    );
    out.subtitles.push(...hitSet);
  }

  out.subtitles = uniq(out.subtitles);
  return out;
}

async function discoverOriginFromApp(startUrl, opts) {
  const { insecure, resolve, verbose } = opts;
  const r = await requestText(startUrl, { insecure, resolve });
  if (r.status !== 200) throw new Error(`libvio.app 请求失败: ${r.status} ${startUrl}`);

  // 从页面提取候选源站：优先 site/mov，再其他
  const urls = parseAllUrls(r.text)
    .filter((u) => /libvio\./i.test(u))
    .filter((u) => /^https:\/\//i.test(u));

  // 明确优先级：site > mov > 其他（mov 在部分环境下更容易被风控/复位）
  const prefer = [];
  for (const u of urls) if (/www\.libvio\.site\b/i.test(u)) prefer.push(u);
  for (const u of urls) if (/www\.libvio\.mov\b/i.test(u)) prefer.push(u);
  for (const u of urls) if (!prefer.includes(u)) prefer.push(u);

  // 探活：能 200 返回首页就算可用
  for (const u of uniq(prefer)) {
    try {
      const home = await requestBytes(u, { insecure, resolve, timeoutMs: 12000, maxRedirects: 3 });
      if (home.status === 200) return new URL(u).origin;
      if (verbose) console.error(`[DISCOVER] skip ${u} status=${home.status}`);
    } catch (e) {
      if (verbose) console.error(`[DISCOVER] skip ${u} err=${e && e.message}`);
    }
  }

  // 兜底：直接用 startUrl 自己的 origin
  return new URL(startUrl).origin;
}

function createLimiter(max) {
  let active = 0;
  const q = [];
  const runNext = () => {
    if (active >= max) return;
    const it = q.shift();
    if (!it) return;
    active++;
    Promise.resolve()
      .then(it.fn)
      .then((v) => it.resolve(v), (e) => it.reject(e))
      .finally(() => {
        active--;
        runNext();
      });
  };
  return (fn) =>
    new Promise((resolve, reject) => {
      q.push({ fn, resolve, reject });
      runNext();
    });
}

function stripTags(s) {
  return String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function scoreSubtitleHint(text) {
  const t = String(text || '');
  let score = 0;
  if (/外挂中字|内封中字|内嵌中字|双语字幕|字幕组/i.test(t)) score += 8;
  if (/中字|字幕|双语|听译|机翻/i.test(t)) score += 4;
  if (/subtitle|subtitles|captions|closed\s*captions|\bcc\b/i.test(t)) score += 3;
  return score;
}

function parseShowSeedPaths(homeHtml) {
  const fromHome = uniq((homeHtml.match(/\/show\/\d+-----------\.html/g) || []).map((s) => String(s)));
  if (fromHome.length) return fromHome;
  return ['/show/1-----------.html', '/show/2-----------.html', '/show/4-----------.html', '/show/15-----------.html', '/show/16-----------.html'];
}

function extractShowNextPath(showHtml) {
  const m1 = showHtml.match(/<a\s+href="([^"]+)"[^>]*>\s*下一页\s*<\/a>/i);
  if (m1) return m1[1];
  const m2 = showHtml.match(/<a[^>]*class="right"[^>]*href="([^"]+)"/i);
  if (m2) return m2[1];
  return '';
}

function extractShowPrevPath(showHtml) {
  const m1 = showHtml.match(/<a\s+href="([^"]+)"[^>]*>\s*上一页\s*<\/a>/i);
  if (m1) return m1[1];
  const m2 = showHtml.match(/<a[^>]*class="left"[^>]*href="([^"]+)"/i);
  if (m2) return m2[1];
  return '';
}

function extractShowLastPath(showHtml) {
  const m = showHtml.match(/<a\s+href="([^"]+)"[^>]*>\s*尾页\s*<\/a>/i);
  return m ? m[1] : '';
}

function parseShowDetailEntries(showHtml) {
  const out = [];
  const liRe = /<li[^>]*>\s*<div class="stui-vodlist__box">([\s\S]*?)<\/li>/gi;
  for (const m of showHtml.matchAll(liRe)) {
    const block = m[1] || '';
    const dm = block.match(/\/detail\/\d+\.html/);
    if (!dm) continue;
    const detail = dm[0];
    const titleM = block.match(/title="([^"]+)"/i);
    const picTextM = block.match(/<span[^>]*class="[^"]*pic-text[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    const title = titleM ? stripTags(titleM[1]) : '';
    const hint = picTextM ? stripTags(picTextM[1]) : '';
    const score = scoreSubtitleHint(`${title} ${hint} ${block}`);
    out.push({ detail, title, hint, score });
  }

  if (out.length) return out;
  for (const d of uniq((showHtml.match(/\/detail\/\d+\.html/g) || []).map((s) => String(s)))) {
    out.push({ detail: d, title: '', hint: '', score: 0 });
  }
  return out;
}

function mergeDetailEntries(map, entries) {
  for (const it of entries || []) {
    if (!it || !it.detail) continue;
    const old = map.get(it.detail);
    if (!old) {
      map.set(it.detail, {
        detail: it.detail,
        title: it.title || '',
        hint: it.hint || '',
        score: Number(it.score || 0),
      });
      continue;
    }
    if (Number(it.score || 0) > Number(old.score || 0)) old.score = Number(it.score || 0);
    if (!old.title && it.title) old.title = it.title;
    if (!old.hint && it.hint) old.hint = it.hint;
  }
}

function sortDetailEntries(entries) {
  return [...(entries || [])].sort((a, b) => (Number(b.score || 0) - Number(a.score || 0)));
}

async function collectDetailEntriesFromHome(origin, opts) {
  const { insecure, resolve, verbose } = opts;
  const home = await requestText(`${origin}/`, { insecure, resolve, timeoutMs: 20000, retries: opts.retries, retryDelayMs: opts.retryDelayMs });
  if (home.status !== 200) throw new Error(`首页请求失败: ${home.status} ${origin}/`);
  const details = uniq((home.text.match(/\/detail\/\d+\.html/g) || []).map((s) => String(s))).map((d) => ({ detail: d, title: '', hint: '', score: 0 }));
  if (verbose) console.error(`[SCAN-HOME] details=${details.length}`);
  return details;
}

async function collectDetailEntriesFromShow(origin, opts) {
  const { insecure, resolve, showSeeds, showPages, showTail, verbose } = opts;
  const home = await requestText(`${origin}/`, { insecure, resolve, timeoutMs: 20000, retries: opts.retries, retryDelayMs: opts.retryDelayMs });
  if (home.status !== 200) throw new Error(`首页请求失败: ${home.status} ${origin}/`);

  const seedsAll = parseShowSeedPaths(home.text);
  const seeds = seedsAll.slice(0, Math.max(1, showSeeds));
  const detailMap = new Map();
  const seenPage = new Set();

  for (const seed of seeds) {
    let cur = absUrl(origin, seed);
    if (showTail) {
      try {
        const r0 = await requestText(cur, { insecure, resolve, timeoutMs: 25000, retries: opts.retries, retryDelayMs: opts.retryDelayMs });
        if (r0.status === 200) {
          const lastPath = extractShowLastPath(r0.text);
          const lastUrl = absUrl(cur, lastPath);
          if (lastUrl) cur = lastUrl;
        }
      } catch {
        // ignore, fallback to seed
      }
    }
    for (let i = 0; i < Math.max(1, showPages); i++) {
      if (!cur || seenPage.has(cur)) break;
      seenPage.add(cur);

      const r = await requestText(cur, { insecure, resolve, timeoutMs: 25000, retries: opts.retries, retryDelayMs: opts.retryDelayMs });
      if (r.status !== 200) {
        if (verbose) console.error(`[SCAN-DEEP] show fail status=${r.status} ${cur}`);
        break;
      }

      const detailEntries = parseShowDetailEntries(r.text);
      mergeDetailEntries(detailMap, detailEntries);
      if (verbose) console.error(`[SCAN-DEEP] show ${seed} page=${i + 1} details+${detailEntries.length} total=${detailMap.size}`);

      const stepPath = showTail ? extractShowPrevPath(r.text) : extractShowNextPath(r.text);
      const stepUrl = absUrl(cur, stepPath);
      if (!stepPath || !stepUrl || stepUrl === cur) break;
      cur = stepUrl;
    }
  }

  return sortDetailEntries([...detailMap.values()]);
}

async function scanFromDetailEntries(origin, detailEntries, opts, tag) {
  const { insecure, resolve, maxDetails, maxPlays, concurrency, verbose } = opts;
  const lim = createLimiter(Math.max(1, concurrency));

  const details = sortDetailEntries(detailEntries || []).slice(0, Math.max(0, maxDetails));
  if (verbose) {
    const hinted = details.filter((d) => Number(d.score || 0) > 0).length;
    console.error(`[${tag}] details=${(detailEntries || []).length} use=${details.length} hinted=${hinted}`);
  }

  const playMap = new Map(); // playPath => meta
  for (const d of details) {
    const dr = await requestText(absUrl(origin, d.detail), {
      insecure,
      resolve,
      timeoutMs: 22000,
      retries: opts.retries,
      retryDelayMs: opts.retryDelayMs,
    });
    if (dr.status !== 200) continue;
    const ps = dr.text.match(/\/play\/\d+-\d+-\d+\.html/g) || [];
    for (const p of ps) {
      const old = playMap.get(p);
      if (!old || Number(d.score || 0) > Number(old.score || 0)) {
        playMap.set(p, { score: Number(d.score || 0), detail: d.detail, hint: d.hint || '', title: d.title || '' });
      }
    }
    if (playMap.size >= maxPlays * 2) break;
  }

  const plays = [...playMap.entries()]
    .sort((a, b) => (Number(b[1].score || 0) - Number(a[1].score || 0)))
    .slice(0, Math.max(0, maxPlays))
    .map(([p, meta]) => ({ url: absUrl(origin, p), meta }));

  if (verbose) {
    console.error(`[${tag}] plays=${playMap.size} use=${plays.length}`);
    const top = plays.filter((p) => Number(p.meta.score || 0) > 0).slice(0, 5);
    for (const t of top) {
      console.error(`[${tag}] HINT score=${t.meta.score} detail=${t.meta.detail} title=${t.meta.title || '-'} hint=${t.meta.hint || '-'}`);
    }
  }

  let found = null;
  let done = 0;
  const tasks = plays.map((it) =>
    lim(async () => {
      if (found) return null;
      try {
        const r = await resolveFromPlayPage(it.url, {
          ...opts,
          probeMp4Subs: opts.probeMp4Subs !== false && !!opts.scanMp4Probe,
        });
        done++;
        if (verbose) console.error(`[${tag}] ${done}/${plays.length} score=${it.meta.score} from=${r.from} subs=${r.subtitles.length} ${it.url}`);
        if (r.subtitles.length) found = r;
        return r;
      } catch (e) {
        done++;
        if (verbose) console.error(`[${tag}] ${done}/${plays.length} ERR ${it.url}: ${e && e.message}`);
        return null;
      }
    }),
  );

  await Promise.all(tasks);
  return found;
}

async function scanForFirstSubtitle(origin, opts) {
  const homeEntries = await collectDetailEntriesFromHome(origin, opts);
  return scanFromDetailEntries(origin, homeEntries, opts, 'SCAN-HOME');
}

async function scanForFirstSubtitleDeep(origin, opts) {
  const merged = new Map();
  // 深度扫描时，优先 show 列表（尤其是 --show-tail），首页仅作为兜底补充
  const homeEntries = (await collectDetailEntriesFromHome(origin, opts)).map((e) => ({ ...e, score: Number(e.score || 0) - 0.1 }));
  mergeDetailEntries(merged, homeEntries);
  mergeDetailEntries(merged, await collectDetailEntriesFromShow(origin, opts));
  return scanFromDetailEntries(origin, [...merged.values()], opts, 'SCAN-DEEP');
}

async function main() {
  const cfg = parseArgs(process.argv.slice(2));
  if (cfg.help) {
    console.log(
      [
        '用法:',
        '  node ctf_libvio.js --play https://www.libvio.site/play/714893137-4-1.html',
        '  node ctf_libvio.js --scan',
        '  node ctf_libvio.js --scan-deep --max-details 300 --max-plays 1200',
        '',
        '常用参数:',
        '  --start <url>        起始页（默认 https://www.libvio.app/）',
        '  --origin <url>       指定源站 origin（跳过 start 发现）',
        '  --play <url>         指定 play 页（单次解析）',
        '  --scan               从源站首页扫描，找到第一个“有字幕线索”的播放页',
        '  --scan-deep          深度扫描 /show 分页（默认在 --scan 失败后自动回退）',
        '  --max-details <n>    扫描 detail 数（默认 40）',
        '  --max-plays <n>      扫描 play 数（默认 120）',
        '  --show-seeds <n>     深度扫描时使用的 show 分类数（默认 6）',
        '  --show-pages <n>     每个 show 分类向后翻页数（默认 30）',
        '  --show-tail          深度扫描从尾页向前翻（更容易覆盖老资源/冷门线路）',
        '  --concurrency <n>    并发（默认 8）',
        '  --retries <n>        请求重试次数（默认 2）',
        '  --retry-delay <ms>   重试基础延迟毫秒（默认 350）',
        '  --scan-mp4-probe     扫描模式启用 mp4 字幕猜测（默认关闭，提升扫描速度）',
        '  --no-mp4-probe       全局关闭 mp4 字幕猜测',
        '  --resolve host:port:ip  强制解析（可重复）',
        '  --secure/--insecure  是否校验证书（默认 insecure）',
        '  --json               输出 JSON',
        '  --verbose            输出扫描过程',
      ].join('\n'),
    );
    return;
  }

  const opts = {
    insecure: cfg.insecure,
    resolve: cfg.resolve,
    maxDetails: cfg.maxDetails,
    maxPlays: cfg.maxPlays,
    showSeeds: cfg.showSeeds,
    showPages: cfg.showPages,
    showTail: cfg.showTail,
    concurrency: cfg.concurrency,
    retries: cfg.retries,
    retryDelayMs: cfg.retryDelayMs,
    probeMp4Subs: cfg.mp4Probe,
    scanMp4Probe: cfg.scanMp4Probe,
    verbose: cfg.verbose,
  };

  const origin = cfg.origin ? new URL(cfg.origin).origin : await discoverOriginFromApp(cfg.start, opts);

  let result;
  if (cfg.play) {
    result = await resolveFromPlayPage(cfg.play, opts);
  } else {
    if (!cfg.scan && !cfg.scanDeep) cfg.scan = true;
    if (cfg.scanDeep) {
      result = await scanForFirstSubtitleDeep(origin, opts);
    } else {
      result = await scanForFirstSubtitle(origin, opts);
      if (!result) {
        if (cfg.verbose) console.error('[SCAN] 首页扫描未命中，自动切换深度扫描...');
        result = await scanForFirstSubtitleDeep(origin, opts);
      }
    }
    if (!result) {
      throw new Error(`扫描结束：未发现带字幕线索的播放页（origin=${origin}）。可提高 --max-details/--max-plays/--show-pages 或指定 --play。`);
    }
  }

  if (cfg.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // 人类可读输出（方便直接当 flag 提交）
  console.log(`PLAY_PAGE=${result.play}`);
  console.log(`FROM=${result.from}`);
  if (result.master && result.master !== result.source) console.log(`MASTER=${result.master}`);
  console.log(`FINAL_SOURCE=${result.source}`);
  if (result.subtitles.length) {
    for (const s of result.subtitles) console.log(`SUBTITLE=${s}`);
  } else {
    console.log('SUBTITLE=NONE');
  }
}

main().catch((e) => {
  console.error(`[FATAL] ${e && e.message ? e.message : String(e)}`);
  process.exitCode = 1;
});
