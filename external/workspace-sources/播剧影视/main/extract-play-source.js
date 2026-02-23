#!/usr/bin/env node
/**
 * Zero-dependency extractor for the "MacPlayer + ec.php + ConFig AES" flow.
 *
 * Usage:
 *   node extract-play-source.js https://www.ysxq.cc/vodplay/116295-1-1.html
 *
 * Options:
 *   --verbose           Print progress logs to stderr.
 *   --no-m3u8           Do not fetch/resolve m3u8 variants; only output decrypted URL.
 *   --insecure          Disable TLS verification (CTF/local only).
 *   --timeout-ms <n>    Per-request timeout in ms (default 20000).
 *
 * Output:
 *   JSON to stdout.
 */

'use strict';

const crypto = require('node:crypto');
const { URL } = require('node:url');
const {
  extractSingleVariableFromHtml,
  stringifyObjectLiteral,
} = require('./ast_env');

function parseArgs(argv) {
  const out = {
    url: null,
    verbose: false,
    noM3u8: false,
    insecure: false,
    timeoutMs: 20_000,
  };

  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--verbose') out.verbose = true;
    else if (a === '--no-m3u8') out.noM3u8 = true;
    else if (a === '--insecure') out.insecure = true;
    else if (a === '--timeout-ms') {
      const v = argv[++i];
      if (!v || !/^\d+$/.test(v)) throw new Error('Invalid --timeout-ms value');
      out.timeoutMs = Number(v);
    } else if (a.startsWith('-')) {
      throw new Error(`Unknown option: ${a}`);
    } else {
      positional.push(a);
    }
  }

  if (positional.length !== 1) {
    throw new Error('Usage: node extract-play-source.js <vodplay_url> [--verbose] [--no-m3u8] [--insecure]');
  }
  out.url = positional[0];
  return out;
}

function vlog(enabled, ...args) {
  if (!enabled) return;
  console.error(...args);
}

function isProbablyUrl(s) {
  if (typeof s !== 'string') return false;
  try {
    // eslint-disable-next-line no-new
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function jsUnescape(s) {
  // Node still provides global `unescape` (legacy JS). This matches the player.js behavior.
  // eslint-disable-next-line no-undef
  return unescape(String(s));
}

function extractBalancedObject(text, anchor) {
  const anchorName = extractAnchorVariableName(anchor);
  if (anchorName) {
    const astValue = extractSingleVariableFromHtml(text, anchorName, {
      timeoutMs: 120,
    });
    const astJson = stringifyObjectLiteral(astValue);
    if (astJson) return astJson;
  }

  const idx = text.indexOf(anchor);
  if (idx < 0) return null;
  const start = text.indexOf('{', idx);
  if (start < 0) return null;

  let depth = 0;
  let inStr = false;
  let quote = '';
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (ch === '\\') {
        esc = true;
        continue;
      }
      if (ch === quote) {
        inStr = false;
        quote = '';
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inStr = true;
      quote = ch;
      continue;
    }

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function extractAnchorVariableName(anchor) {
  const src = String(anchor || '');
  const m = src.match(/([A-Za-z_$][\w$]*)\s*=?\s*$/);
  return m ? m[1] : '';
}

class CookieJar {
  constructor() {
    /** @type {Map<string, Map<string, string>>} */
    this._jar = new Map();
  }

  /**
   * @param {string} hostname
   * @param {string[]} setCookieHeaders
   */
  ingest(hostname, setCookieHeaders) {
    if (!setCookieHeaders || setCookieHeaders.length === 0) return;
    let hostJar = this._jar.get(hostname);
    if (!hostJar) {
      hostJar = new Map();
      this._jar.set(hostname, hostJar);
    }
    for (const h of setCookieHeaders) {
      const first = String(h).split(';', 1)[0];
      const eq = first.indexOf('=');
      if (eq <= 0) continue;
      const name = first.slice(0, eq).trim();
      const value = first.slice(eq + 1).trim();
      if (!name) continue;
      hostJar.set(name, value);
    }
  }

  /**
   * @param {string} hostname
   */
  header(hostname) {
    const hostJar = this._jar.get(hostname);
    if (!hostJar || hostJar.size === 0) return '';
    return Array.from(hostJar.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }
}

async function fetchText(url, opts) {
  const { timeoutMs, verbose, jar, extraHeaders } = opts;

  const u = new URL(url);
  const headers = {
    // Some targets behave differently based on UA; use a common desktop Chrome UA.
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    accept: '*/*',
    'accept-language': 'zh-CN,zh;q=0.9',
    ...extraHeaders,
  };
  const cookie = jar ? jar.header(u.hostname) : '';
  if (cookie) headers.cookie = cookie;

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
  try {
    vlog(verbose, 'GET', url);
    let res;
    try {
      res = await fetch(url, { headers, signal: ac.signal, redirect: 'follow' });
    } catch (e) {
      const cause = e && typeof e === 'object' && 'cause' in e ? e.cause : null;
      const causeMsg = cause ? `; cause=${String(cause && cause.message ? cause.message : cause)}` : '';
      throw new Error(`fetch failed: ${url}; ${String(e && e.message ? e.message : e)}${causeMsg}`);
    }
    const setCookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
    if (jar && setCookies.length > 0) jar.ingest(u.hostname, setCookies);
    const body = await res.text();
    return { status: res.status, headers: res.headers, body };
  } finally {
    clearTimeout(t);
  }
}

function normalizePlayerUrl(player) {
  const out = { ...player };
  const enc = String(player.encrypt ?? '0');
  if (enc === '1') {
    out.url = jsUnescape(out.url);
    out.url_next = jsUnescape(out.url_next || '');
  } else if (enc === '2') {
    const decoded = Buffer.from(String(out.url || ''), 'base64').toString('utf8');
    out.url = jsUnescape(decoded);
    const decodedNext = Buffer.from(String(out.url_next || ''), 'base64').toString('utf8');
    out.url_next = jsUnescape(decodedNext);
  }
  return out;
}

function decryptConFigUrl(uid, b64Cipher) {
  if (!uid) throw new Error('ConFig.config.uid is missing');
  if (!b64Cipher) throw new Error('ConFig.url is missing');

  const keyStr = `2890${uid}tB959C`;
  const ivStr = '2F131BE91247866E';
  const key = Buffer.from(keyStr, 'utf8');
  const iv = Buffer.from(ivStr, 'utf8');
  const cipher = Buffer.from(String(b64Cipher), 'base64');

  let algo = null;
  if (key.length === 16) algo = 'aes-128-cbc';
  else if (key.length === 24) algo = 'aes-192-cbc';
  else if (key.length === 32) algo = 'aes-256-cbc';
  else throw new Error(`Unsupported AES key length: ${key.length} (uid length=${String(uid).length})`);

  const decipher = crypto.createDecipheriv(algo, key, iv);
  decipher.setAutoPadding(true);
  const plain = Buffer.concat([decipher.update(cipher), decipher.final()]);
  return plain.toString('utf8');
}

function buildEcPhpUrl(player, playerScriptText) {
  // Most lines: https://play.91ju.cc/player/ec.php?code=lg&if=1&url='+MacPlayer.PlayFrom+'&url='+MacPlayer.PlayUrl+'
  // Some lines (rym3u8): https://play.91ju.cc/player/ec.php?if=1&code=lg&id='+MacPlayer.Id+'&from='+MacPlayer.PlayFrom+'&sid='+MacPlayer.Sid+'&nid='+MacPlayer.Nid+'&url='+MacPlayer.PlayUrl+'&next='+MacPlayer.NextUrl+'
  const base = 'https://play.91ju.cc/player/ec.php';

  const looksExtended =
    /id='\+MacPlayer\.Id/.test(playerScriptText) ||
    /from='\+MacPlayer\.PlayFrom/.test(playerScriptText) ||
    /sid='\+MacPlayer\.Sid/.test(playerScriptText) ||
    /nid='\+MacPlayer\.Nid/.test(playerScriptText) ||
    /next='\+MacPlayer\./.test(playerScriptText);

  if (!looksExtended) {
    const sp = new URLSearchParams();
    sp.set('code', 'lg');
    sp.set('if', '1');
    sp.append('url', String(player.from));
    sp.append('url', String(player.url));
    return `${base}?${sp.toString()}`;
  }

  const sp = new URLSearchParams();
  sp.set('if', '1');
  sp.set('code', 'lg');
  if (player.id) sp.set('id', String(player.id));
  sp.set('from', String(player.from));
  if (player.sid != null) sp.set('sid', String(player.sid));
  if (player.nid != null) sp.set('nid', String(player.nid));
  sp.set('url', String(player.url));
  sp.set('next', String(player.url_next || ''));
  return `${base}?${sp.toString()}`;
}

function parseM3u8Variants(masterText, masterUrl) {
  const lines = masterText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const variants = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.startsWith('#EXT-X-STREAM-INF:')) continue;
    const attrs = l.slice('#EXT-X-STREAM-INF:'.length);
    const bwMatch = attrs.match(/BANDWIDTH=(\d+)/);
    const bandwidth = bwMatch ? Number(bwMatch[1]) : null;
    const uri = lines[i + 1] && !lines[i + 1].startsWith('#') ? lines[i + 1] : null;
    if (!uri) continue;
    const abs = new URL(uri, masterUrl).toString();
    variants.push({ bandwidth, uri: abs, rawUri: uri, rawInf: l });
  }
  return variants;
}

function parseM3u8Subtitles(m3u8Text, m3u8Url) {
  const lines = m3u8Text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const subs = [];

  for (const l of lines) {
    if (l.startsWith('#EXT-X-MEDIA:') && /TYPE=SUBTITLES/.test(l) && /URI="/.test(l)) {
      const m = l.match(/URI="([^"]+)"/);
      if (m) {
        subs.push({ type: 'hls-subtitles', uri: new URL(m[1], m3u8Url).toString(), raw: l });
      }
    }
    const low = l.toLowerCase();
    if (low.includes('.vtt') || low.includes('.srt') || low.includes('.ass') || low.includes('.ssa')) {
      // Some providers list subtitle files directly as URIs.
      try {
        subs.push({ type: 'file', uri: new URL(l, m3u8Url).toString(), raw: l });
      } catch {
        // ignore
      }
    }
  }

  // Deduplicate by uri
  const seen = new Set();
  return subs.filter((s) => {
    if (seen.has(s.uri)) return false;
    seen.add(s.uri);
    return true;
  });
}

async function resolveFinalM3u8(url, opts) {
  const { timeoutMs, verbose, jar } = opts;

  const masterRes = await fetchText(url, {
    timeoutMs,
    verbose,
    jar,
    extraHeaders: {
      // Some CDNs behave differently. Mimic browser-like Origin.
      origin: 'https://play.91ju.cc',
      referer: '',
    },
  });
  if (masterRes.status < 200 || masterRes.status >= 300) {
    return { masterUrl: url, error: `m3u8 fetch failed: HTTP ${masterRes.status}` };
  }

  const masterText = masterRes.body;
  const subs = parseM3u8Subtitles(masterText, url);
  const variants = parseM3u8Variants(masterText, url);

  if (variants.length === 0) {
    return { masterUrl: url, playlistUrl: url, subtitles: subs };
  }

  // Pick the highest BANDWIDTH, fallback to first.
  variants.sort((a, b) => (b.bandwidth ?? -1) - (a.bandwidth ?? -1));
  const picked = variants[0];
  return { masterUrl: url, playlistUrl: picked.uri, pickedVariant: picked, subtitles: subs };
}

async function main() {
  const cfg = parseArgs(process.argv);
  if (cfg.insecure) {
    // CTF/local only.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  const jar = new CookieJar();

  const vodplayUrl = cfg.url;
  if (!isProbablyUrl(vodplayUrl)) throw new Error(`Invalid URL: ${vodplayUrl}`);

  const vodplayRes = await fetchText(vodplayUrl, {
    timeoutMs: cfg.timeoutMs,
    verbose: cfg.verbose,
    jar,
    extraHeaders: { accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
  });
  if (vodplayRes.status < 200 || vodplayRes.status >= 300) {
    throw new Error(`vodplay fetch failed: HTTP ${vodplayRes.status}`);
  }

  const vodplayHtml = vodplayRes.body;
  const playerJson = extractBalancedObject(vodplayHtml, 'player_aaaa');
  if (!playerJson) throw new Error('player_aaaa JSON not found in vodplay HTML');
  let player = JSON.parse(playerJson);
  player = normalizePlayerUrl(player);

  const origin = new URL(vodplayUrl).origin;
  const playerScriptUrl = `${origin}/static/player/${encodeURIComponent(String(player.from))}.js`;
  const playerScriptRes = await fetchText(playerScriptUrl, {
    timeoutMs: cfg.timeoutMs,
    verbose: cfg.verbose,
    jar,
  });
  if (playerScriptRes.status < 200 || playerScriptRes.status >= 300) {
    throw new Error(`player script fetch failed: HTTP ${playerScriptRes.status} (${playerScriptUrl})`);
  }
  const playerScriptText = playerScriptRes.body;

  const out = {
    input: { vodplayUrl },
    player: {
      from: player.from,
      encrypt: player.encrypt ?? 0,
      url: player.url,
      url_next: player.url_next || '',
      id: player.id ?? null,
      sid: player.sid ?? null,
      nid: player.nid ?? null,
    },
    flow: {
      playerScriptUrl,
      mode: null,
      ecPhpUrl: null,
    },
    config: null,
    result: {
      decryptedUrl: null,
      masterUrl: null,
      playlistUrl: null,
      subtitles: [],
    },
  };

  if (!/play\.91ju\.cc\/player\/ec\.php/.test(playerScriptText)) {
    out.flow.mode = 'unsupported';
    out.flow.reason = 'static/player/<from>.js does not use play.91ju.cc ec.php in this line';
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  out.flow.mode = 'ec.php';
  const ecPhpUrl = buildEcPhpUrl(player, playerScriptText);
  out.flow.ecPhpUrl = ecPhpUrl;

  const ecRes = await fetchText(ecPhpUrl, {
    timeoutMs: cfg.timeoutMs,
    verbose: cfg.verbose,
    jar,
    extraHeaders: { accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
  });
  if (ecRes.status < 200 || ecRes.status >= 300) {
    throw new Error(`ec.php fetch failed: HTTP ${ecRes.status}`);
  }
  const ecHtml = ecRes.body;
  const conFigJson = extractBalancedObject(ecHtml, 'let ConFig');
  if (!conFigJson) throw new Error('ConFig JSON not found in ec.php HTML');
  const conFig = JSON.parse(conFigJson);

  out.config = {
    uid: conFig?.config?.uid ?? null,
    id1: conFig?.id1 ?? null,
    id2: conFig?.id2 ?? null,
    code: conFig?.code ?? null,
    type: conFig?.type ?? null,
    zm_url: conFig?.config?.zm_url ?? null,
    enc_url: conFig?.url ?? null,
  };

  const decryptedUrl = decryptConFigUrl(out.config.uid, out.config.enc_url).trim();
  out.result.decryptedUrl = decryptedUrl;

  const baseSubtitles = [];
  const zmUrl = String(out.config.zm_url ?? '').trim();
  if (zmUrl && zmUrl.toLowerCase() !== 'null') {
    // Some lines provide subtitles via ConFig.config.zm_url (direct file or an API URL).
    try {
      baseSubtitles.push({ type: 'zm_url', uri: new URL(zmUrl, ecPhpUrl).toString(), raw: zmUrl });
    } catch {
      baseSubtitles.push({ type: 'zm_url', uri: zmUrl, raw: zmUrl });
    }
  }

  if (cfg.noM3u8) {
    out.result.subtitles = baseSubtitles;
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  if (decryptedUrl.toLowerCase().includes('.m3u8')) {
    try {
      const resolved = await resolveFinalM3u8(decryptedUrl, {
        timeoutMs: cfg.timeoutMs,
        verbose: cfg.verbose,
        jar,
      });
      out.result.masterUrl = resolved.masterUrl ?? decryptedUrl;
      out.result.playlistUrl = resolved.playlistUrl ?? resolved.masterUrl ?? decryptedUrl;
      const mergedSubs = [...baseSubtitles, ...((resolved.subtitles ?? []) || [])];
      // Deduplicate by uri (keep first occurrence).
      const seen = new Set();
      out.result.subtitles = mergedSubs.filter((s) => {
        const uri = s && typeof s === 'object' ? s.uri : null;
        if (!uri || typeof uri !== 'string') return false;
        if (seen.has(uri)) return false;
        seen.add(uri);
        return true;
      });
      if (resolved.pickedVariant) out.result.pickedVariant = resolved.pickedVariant;
      if (resolved.error) out.result.error = resolved.error;
    } catch (e) {
      out.result.error = String(e && e.message ? e.message : e);
    }
  } else if (baseSubtitles.length > 0) {
    out.result.subtitles = baseSubtitles;
  }

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(String(e && e.stack ? e.stack : e));
  process.exitCode = 1;
});
