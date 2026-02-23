import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {validatePwd} from '../utils/api_validate.js';

const CHN_BOJU = '\u64ad\u5267\u5f71\u89c6';
const CHN_DBKK = '\u72ec\u64ad\u5e93';

const ALL_SITE_IDS = [
    'kvm4',
    'cz233',
    'netflixgc',
    'ysxq',
    'dbkk',
    'aiyifan',
    'bgm',
    'kuangren',
    'kanbot',
    'iyf',
    'libvio',
];

const DEFAULT_DISABLED_SITE_IDS = new Set(['ysxq', 'kanbot', 'libvio']);

function parseSiteIdsFromEnv() {
    const raw = String(process.env.CTF_LOCAL_ADAPTER_SITE_IDS || '').trim();
    if (!raw) return null;
    const allow = new Set(ALL_SITE_IDS);
    const picked = raw.split(',').map((x) => x.trim()).filter((x) => allow.has(x));
    return uniq(picked);
}

function resolveEnabledSiteIds() {
    const explicit = parseSiteIdsFromEnv();
    if (explicit && explicit.length) return explicit;

    const includeUnstable = ['1', 'true', 'yes', 'on']
        .includes(String(process.env.CTF_LOCAL_INCLUDE_UNSTABLE || '').trim().toLowerCase());
    if (includeUnstable) return [...ALL_SITE_IDS];
    return ALL_SITE_IDS.filter((id) => !DEFAULT_DISABLED_SITE_IDS.has(id));
}

const SITE_IDS = resolveEnabledSiteIds();

const CTF_INTERNAL_WORKSPACE_REL = path.join('external', 'workspace-sources');
const CTF_EXPECTED_DIRS = [
    '.4kvm.tv',
    '.cz233.com',
    '.netflixgc.com',
    CHN_BOJU,
    CHN_DBKK,
    'aiyifan',
    'bgm.girigirilove.com',
    'kuangren.us',
    'kanbot.com',
    'iyf.tv',
    'libvio',
];

const SITE_META = {
    kvm4: {
        key: 'ctf_local_kvm4',
        name: 'CTF-4kvm(Local)',
        typeName: 'CTF',
        movieName: '4kvm regression sample',
        entryHint: 'https://www.4kvm.tv/movies/hsbdla',
        icon: 'https://www.4kvm.tv/favicon.ico',
    },
    cz233: {
        key: 'ctf_local_cz233',
        name: 'CTF-cz233(Local)',
        typeName: 'CTF',
        movieName: 'cz233 regression sample',
        entryHint: 'https://www.czzymovie.com/',
        icon: 'https://www.czzymovie.com/favicon.ico',
    },
    netflixgc: {
        key: 'ctf_local_netflixgc',
        name: 'CTF-netflixgc(Local)',
        typeName: 'CTF',
        movieName: 'netflixgc regression sample',
        entryHint: 'https://www.netflixgc.com/play/80498-1-1.html',
        icon: 'https://www.netflixgc.com/favicon.ico',
    },
    ysxq: {
        key: 'ctf_local_ysxq',
        name: 'CTF-boju(Local)',
        typeName: 'CTF',
        movieName: 'boju regression sample',
        entryHint: 'https://www.ysxq.cc/vodplay/116295-1-1.html',
        icon: 'https://www.ysxq.cc/favicon.ico',
    },
    dbkk: {
        key: 'ctf_local_dbkk',
        name: 'CTF-dbkk(Local)',
        typeName: 'CTF',
        movieName: 'dbkk regression sample',
        entryHint: 'https://www.dbkk.cc/play/2026813471-ep6',
        icon: 'https://www.dbkk.cc/favicon.ico',
    },
    aiyifan: {
        key: 'ctf_local_aiyifan',
        name: 'CTF-aiyifan(Local)',
        typeName: 'CTF',
        movieName: 'aiyifan regression sample',
        entryHint: 'https://www.iyf.tv/play/rHdszVLeZIT?id=1KemI6nhFaA',
        icon: 'https://www.iyf.tv/favicon.ico',
    },
    bgm: {
        key: 'ctf_local_bgm',
        name: 'CTF-bgm(Local)',
        typeName: 'CTF',
        movieName: 'bgm regression sample',
        entryHint: 'https://bgm.girigirilove.com/GV26896/',
        icon: 'https://bgm.girigirilove.com/favicon.ico',
    },
    kuangren: {
        key: 'ctf_local_kuangren',
        name: 'CTF-kuangren(Local)',
        typeName: 'CTF',
        movieName: 'kuangren regression sample',
        entryHint: 'https://www.kuang1.cfd/vodplay/976081-2-1.html',
        icon: 'https://www.kuang1.cfd/favicon.ico',
    },
    kanbot: {
        key: 'ctf_local_kanbot',
        name: 'CTF-kanbot(Local)',
        typeName: 'CTF',
        movieName: 'kanbot regression sample',
        entryHint: 'https://v.ikanbot.com/play/962794',
        icon: 'https://v.ikanbot.com/favicon.ico',
    },
    iyf: {
        key: 'ctf_local_iyf',
        name: 'CTF-iyf(Local)',
        typeName: 'CTF',
        movieName: 'iyf regression sample',
        entryHint: 'https://www.iyf.tv/play/rHdszVLeZIT?id=1KemI6nhFaA',
        icon: 'https://www.iyf.tv/favicon.ico',
    },
    libvio: {
        key: 'ctf_local_libvio',
        name: 'CTF-libvio(Local)',
        typeName: 'CTF',
        movieName: 'libvio regression sample',
        entryHint: 'https://www.libvio.site/play/714893137-4-1.html',
        icon: 'https://www.libvio.site/favicon.ico',
    },
};

const SOURCE_FALLBACK = {
    netflixgc: [
        'https://json.ksdiy.cn/Vtche/FF/4100819155.m3u8',
        'https://json.ksdiy.cn/Vtche/YZ/3919318965.m3u8',
        'https://vip.dytt-see.com/20251107/5052_86b48b56/index.m3u8',
    ],
    ysxq: [
        'https://cdn.yzzy29-play.com/20250820/620_b73dfe25/2000k/hls/mixed.m3u8',
        'https://cdn.yzzy29-play.com/20250820/620_b73dfe25/index.m3u8',
    ],
    cz233: [
        'https://119.91.61.181:906/hls3/hls/%E5%B3%A1%E8%B0%B7.m3u8',
        'https://v3-cdn-tos.ppxvod.com/89c36eb497ee45088e4c74db8485fef3/69989763/video/tos/cn/tos-cn-v-ec2668/o4ohIX4YUDEdxgdEQR9BfFBkIADbLJ2Nl6KyeA/?fileccc=1.mp4',
    ],
    bgm: [
        'https://ai.girigirilove.net/zijian/oldanime/2026/01/cht/OsananajimitowaLoveComedyniNaranaiCHT/01/playlist.m3u8',
    ],
    kvm4: [
        'https://play.kvmplay.org/m3/d86dcbe1771653498/95Njk5OGEwYmFlN2RhNyQzNTY3JDEkMTc3MTYxMDI5OA6998a0bae7da4.m3u8',
    ],
    libvio: [
        'https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/1080/index.m3u8?ecc=ck_HdmUMvmRVEC5H3uxkkyi5jVWMwSTzngk-P0lG5h6jPzjftqL7Na2ZVYpmb-OlH_0miMnQBMYfAnNL2WEN1GES&ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&t=4&u=1039841853291957277&ot=personal&oi=1039841853291957277&f=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&ext=eyJ1dCI6MX0=&X-Amz-Expires=86400&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260220T175349Z&X-Amz-SignedHeaders=host&X-Amz-Credential=Q2PNRN2OGHZQ1ZDF90XQ%2F20260221%2FZGVmYXVsdA%2Fdefault%2Faws4_request&X-Amz-Signature=2cda89f94ad1341d5ec1e22a50d354da2d9bea851d6dd0a8f4f9d3756daff18a&tvkey=m3u8',
    ],
    kanbot: [
        'https://cdn.yzzy29-play.com/20260215/20128_9abcd7ad/2000k/hls/mixed.m3u8',
    ],
    kuangren: [
        'https://soul.ezplayer.me/hls/4Sl94K3NDr6mT4x_JDV3uA/pk8/5z1ivqb8/tmwzup/tt/master.m3u8',
    ],
    dbkk: [
        'https://cdn.wlcdn99.com:777/86a2ec51/index.m3u8',
    ],
    iyf: [
        'https://s1-a1.global-cdn.me/vod/11611D87803-61387.mp4',
    ],
    aiyifan: [
        'https://s1-a1.global-cdn.me/vod/8390EA63781-74441.mp4',
    ],
};

const nowIso = () => new Date().toISOString();
const cut = (s, n = 180) => (s === undefined || s === null ? '' : String(s).slice(0, n));
const WORKER_TIMEOUT_MS = Math.max(6_000, Number(process.env.CTF_LOCAL_ADAPTER_WORKER_TIMEOUT_MS || 12_000));
const PROBE_TIMEOUT_MS = Math.max(4_000, Number(process.env.CTF_LOCAL_ADAPTER_PROBE_TIMEOUT_MS || 10_000));

const cache = new Map();

function uniq(arr) {
    return [...new Set((arr || []).filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()))];
}

function dirExists(dirPath) {
    try {
        return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    } catch {
        return false;
    }
}

function countWorkspaceMarkers(root) {
    if (!dirExists(root)) return 0;
    let hit = 0;
    for (const name of CTF_EXPECTED_DIRS) {
        const p = path.resolve(root, name);
        if (dirExists(p) || fs.existsSync(p)) {
            hit += 1;
        }
    }
    return hit;
}

function resolveWorkspaceRoot(rootDir) {
    const fromEnv = String(process.env.CTF_LOCAL_WORKSPACE_ROOT || '').trim();
    const candidates = [];
    if (fromEnv) {
        candidates.push({source: 'env', root: path.resolve(fromEnv)});
    }
    candidates.push({source: 'internal', root: path.resolve(rootDir, CTF_INTERNAL_WORKSPACE_REL)});
    candidates.push({source: 'legacy-parent', root: path.resolve(rootDir, '..')});

    const scored = candidates.map((x) => ({
        ...x,
        markers: countWorkspaceMarkers(x.root),
    }));
    const best = scored.find((x) => x.markers >= 3) || scored.find((x) => dirExists(x.root));
    return best || {source: 'internal', root: path.resolve(rootDir, CTF_INTERNAL_WORKSPACE_REL), markers: 0};
}

function safeText(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch {
        return '';
    }
}

function safeJson(filePath) {
    const txt = safeText(filePath);
    if (!txt) return null;
    try {
        return JSON.parse(txt.replace(/^\uFEFF/, ''));
    } catch {
        return null;
    }
}

function asAbsUrl(raw, base) {
    const value = String(raw || '').trim();
    if (!value) return '';
    try {
        if (base) return new URL(value, base).toString();
        return new URL(value).toString();
    } catch {
        return '';
    }
}

function isMediaUrl(url) {
    return /\.(m3u8|mp4|mpd)(?:\?|$)/i.test(String(url || ''));
}

function isSubtitleUrl(url) {
    return /\.(vtt|srt|ass|ssa|xml|ttml|dfxp)(?:\?|$)/i.test(String(url || ''));
}

function parseAmzDate(dateText) {
    const s = String(dateText || '').trim();
    const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const h = Number(m[4]);
    const mi = Number(m[5]);
    const se = Number(m[6]);
    const ts = Date.UTC(y, mo, d, h, mi, se);
    if (!Number.isFinite(ts)) return null;
    return ts;
}

function isExpiredSignedUrl(url) {
    try {
        const u = new URL(String(url || ''));
        const amzDate = u.searchParams.get('X-Amz-Date') || u.searchParams.get('x-amz-date');
        const amzExpires = Number(u.searchParams.get('X-Amz-Expires') || u.searchParams.get('x-amz-expires') || '0');
        if (!amzDate || !Number.isFinite(amzExpires) || amzExpires <= 0) return false;
        const startTs = parseAmzDate(amzDate);
        if (!startTs) return false;
        const expireTs = startTs + amzExpires * 1000;
        return Date.now() > expireTs;
    } catch {
        return false;
    }
}

function extractAllUrls(text) {
    const src = String(text || '');
    const out = [];
    const re = /https?:\/\/[^\s"'<>\\]+/g;
    let m;
    while ((m = re.exec(src)) !== null) {
        out.push(String(m[0] || '').replace(/[",\]\}]+$/, ''));
    }
    return uniq(out);
}

function extractMediaUrls(text) {
    return extractAllUrls(text).filter(isMediaUrl);
}

function fetchJsonWithTimeoutNoThrow(url, timeoutMs = WORKER_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, {signal: controller.signal})
        .then(async (res) => {
            const text = await res.text();
            let body = null;
            try {
                body = JSON.parse(text);
            } catch {
                body = null;
            }
            return {status: res.status, body, text};
        })
        .catch((error) => ({status: 0, body: null, text: '', error: error.message || String(error)}))
        .finally(() => clearTimeout(timer));
}

async function probePlayable(url, timeoutMs = PROBE_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const headers = /\.mp4(?:\?|$)/i.test(url) ? {Range: 'bytes=0-4095'} : {};
        const res = await fetch(url, {
            signal: controller.signal,
            redirect: 'follow',
            headers,
        });
        const contentType = String(res.headers.get('content-type') || '').toLowerCase();
        if (res.ok && /(mpegurl|video|mp4|dash|octet-stream)/i.test(contentType)) {
            return true;
        }
        const buf = Buffer.from(await res.arrayBuffer());
        const sample = buf.toString('utf8', 0, 128);
        const looksHls = /#EXTM3U/i.test(sample);
        const looksMpd = /<MPD/i.test(sample);
        const looksMp4 = /ftyp/i.test(sample);
        return res.ok && (looksHls || looksMpd || looksMp4 || /\.mp4(?:\?|$)/i.test(url) || /\.m3u8(?:\?|$)/i.test(url));
    } catch {
        return false;
    } finally {
        clearTimeout(timer);
    }
}

async function promoteFirstPlayable(urls) {
    const list = uniq(urls);
    if (!list.length) return [];
    const limit = Math.min(5, list.length);
    for (let i = 0; i < limit; i += 1) {
        const ok = await probePlayable(list[i]);
        if (!ok) continue;
        if (i === 0) return list;
        return [list[i], ...list.filter((_, idx) => idx !== i)];
    }
    return list;
}

function loadLatestDbkkOutJson(paths) {
    try {
        const names = fs.readdirSync(paths.dbkkOutDir)
            .filter((x) => /^e2e_\d+_\d+\.json$/i.test(x))
            .map((name) => {
                const full = path.join(paths.dbkkOutDir, name);
                const st = fs.statSync(full);
                return {name, full, mtime: st.mtimeMs || 0};
            })
            .sort((a, b) => b.mtime - a.mtime);

        for (const one of names) {
            const j = safeJson(one.full);
            if (j) return j;
        }
    } catch {
        return null;
    }
    return null;
}

function runNodeJson(workspaceRoot, args, timeoutMs = 60_000) {
    const out = spawnSync(process.execPath, args, {
        cwd: workspaceRoot,
        encoding: 'utf8',
        timeout: timeoutMs,
        maxBuffer: 8 * 1024 * 1024,
    });
    if (out.error || out.status !== 0) return null;
    try {
        return JSON.parse(String(out.stdout || '').trim());
    } catch {
        return null;
    }
}

function getPythonBin() {
    const custom = String(process.env.PYTHON_PATH || '').trim();
    if (custom) {
        return {bin: custom, prefixArgs: []};
    }
    const localAppData = String(process.env.LOCALAPPDATA || '').trim();
    if (localAppData) {
        const pyRoot = path.join(localAppData, 'Programs', 'Python');
        if (fs.existsSync(pyRoot)) {
            try {
                const dirs = fs.readdirSync(pyRoot, {withFileTypes: true})
                    .filter((d) => d.isDirectory())
                    .map((d) => d.name)
                    .sort()
                    .reverse();
                for (const d of dirs) {
                    const exe = path.join(pyRoot, d, 'python.exe');
                    if (fs.existsSync(exe)) {
                        return {bin: exe, prefixArgs: []};
                    }
                }
            } catch {
            }
        }
    }
    const candidates = [
        {bin: 'python', prefixArgs: []},
        {bin: 'py', prefixArgs: ['-3']},
        {bin: 'python3', prefixArgs: []},
    ];
    for (const c of candidates) {
        try {
            const p = spawnSync(c.bin, [...c.prefixArgs, '--version'], {encoding: 'utf8', timeout: 8000});
            if (!p.error && p.status === 0) {
                return c;
            }
        } catch {
        }
    }
    return {bin: 'python', prefixArgs: []};
}

function runPythonCaptureUrls(workspaceRoot, timeoutMs = 95_000) {
    const py = getPythonBin();
    const scriptPath = path.join(workspaceRoot, 'libvio', 'pw_capture_714893137_yd.py');
    if (!fs.existsSync(scriptPath)) {
        return {ok: false, urls: [], subtitles: [], note: 'pw_script_missing'};
    }

    const out = spawnSync(py.bin, [...py.prefixArgs, scriptPath], {
        cwd: workspaceRoot,
        encoding: 'utf8',
        timeout: timeoutMs,
        maxBuffer: 16 * 1024 * 1024,
    });
    if (out.error || out.status !== 0) {
        return {
            ok: false,
            urls: [],
            subtitles: [],
            note: `pw_script_failed(status=${out.status || -1})`,
        };
    }

    const text = `${out.stdout || ''}\n${out.stderr || ''}`;
    const urls = [];
    const subtitles = [];
    const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    for (const line of lines) {
        const m = line.match(/^(req|res)\s+(https?:\/\/\S+)$/i);
        if (!m) continue;
        const u = String(m[2] || '').trim();
        if (!u) continue;
        if (isMediaUrl(u)) {
            urls.push(u);
        } else if (isSubtitleUrl(u)) {
            subtitles.push(u);
        }
    }

    return {
        ok: urls.length > 0,
        urls: uniq(urls),
        subtitles: uniq(subtitles),
        note: urls.length > 0 ? 'pw_capture_ok=true' : 'pw_capture_no_media',
    };
}

function getLibvioLastGoodPath(rootDir) {
    return path.join(rootDir, 'data', 'ctf-local-adapter', 'libvio-last-good.json');
}

function loadLibvioLastGood(rootDir) {
    const filePath = getLibvioLastGoodPath(rootDir);
    const j = safeJson(filePath);
    if (!j || typeof j !== 'object') return null;
    const sources = uniq((Array.isArray(j.sources) ? j.sources : []).filter(isMediaUrl)).filter((u) => !isExpiredSignedUrl(u));
    const subtitles = uniq((Array.isArray(j.subtitles) ? j.subtitles : []).filter(isSubtitleUrl));
    if (!sources.length) return null;
    const updatedAt = String(j.updatedAt || '').trim();
    let ageSec = -1;
    if (updatedAt) {
        const ts = Date.parse(updatedAt);
        if (Number.isFinite(ts)) {
            ageSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
        }
    }
    return {
        sources,
        subtitles,
        updatedAt,
        ageSec,
    };
}

function saveLibvioLastGood(rootDir, sources, subtitles, note = '') {
    const cleanSources = uniq((sources || []).filter(isMediaUrl)).filter((u) => !isExpiredSignedUrl(u));
    if (!cleanSources.length) return false;
    const cleanSubtitles = uniq((subtitles || []).filter(isSubtitleUrl));
    const filePath = getLibvioLastGoodPath(rootDir);
    try {
        fs.mkdirSync(path.dirname(filePath), {recursive: true});
        fs.writeFileSync(filePath, JSON.stringify({
            updatedAt: nowIso(),
            note: String(note || ''),
            sources: cleanSources,
            subtitles: cleanSubtitles,
        }, null, 2), 'utf8');
        return true;
    } catch {
        return false;
    }
}

async function finalizeSiteData(siteId, raw) {
    const subtitles = uniq(raw?.subtitles || []);
    const safeFallback = uniq((SOURCE_FALLBACK[siteId] || []).filter((u) => !isExpiredSignedUrl(u)));
    const fallbackSources = safeFallback.length ? safeFallback : (siteId === 'libvio' ? [] : uniq(SOURCE_FALLBACK[siteId] || []));
    const merged = uniq([...(raw?.sources || []), ...fallbackSources]);
    const nonExpired = merged.filter((u) => !isExpiredSignedUrl(u));
    const sources = nonExpired.length ? nonExpired : merged;
    const promoted = await promoteFirstPlayable(sources);
    const finalSources = promoted.length ? promoted : fallbackSources;
    return {
        sources: finalSources,
        subtitles,
        note: String(raw?.note || 'snapshot_only'),
    };
}

async function extractNetflixgc() {
    const u = new URL('https://netflixgc-ctf-extractor.knieclarine.workers.dev/');
    u.searchParams.set('play_url', 'https://www.netflixgc.com/play/80498-1-1.html');
    u.searchParams.set('all_lines', '1');
    u.searchParams.set('max_depth', '2');
    const r = await fetchJsonWithTimeoutNoThrow(u.toString(), WORKER_TIMEOUT_MS);
    if (r.status === 200 && r.body && r.body.ok === true) {
        const sources = uniq(r.body.final_sources || []);
        if (sources.length) {
            return {sources, subtitles: uniq(r.body.all_subtitles || []), note: 'worker_ok=true'};
        }
    }
    return {
        sources: SOURCE_FALLBACK.netflixgc,
        subtitles: [],
        note: `worker_unavailable(status=${r.status}) fallback_static=true`,
    };
}

async function extractYsxq(paths) {
    const u = new URL('https://ysxq-ctf-extractor.knieclarine.workers.dev/extract');
    u.searchParams.set('id', '116295');
    u.searchParams.set('sid', '1');
    u.searchParams.set('nid', '1');
    u.searchParams.set('verbose', '1');
    const r = await fetchJsonWithTimeoutNoThrow(u.toString(), WORKER_TIMEOUT_MS);
    if (r.status === 200 && r.body && r.body.ok === true) {
        const byWorker = uniq([r.body.playlistUrl, r.body.decryptedUrl].filter(Boolean));
        if (byWorker.length) {
            return {sources: byWorker, subtitles: uniq(r.body.subtitles || []), note: 'worker_ok=true'};
        }
    }

    const snap = safeJson(paths.ysxqSnapshot);
    const bySnap = uniq([snap?.result?.playlistUrl, snap?.result?.decryptedUrl].filter(Boolean));
    if (bySnap.length) {
        return {
            sources: bySnap,
            subtitles: uniq(snap?.result?.subtitles || []),
            note: `worker_unavailable(status=${r.status}) fallback_snapshot=true`,
        };
    }
    return {
        sources: SOURCE_FALLBACK.ysxq,
        subtitles: [],
        note: `worker_unavailable(status=${r.status}) fallback_static=true`,
    };
}

async function extractCz233() {
    const u = new URL('https://czzymovie-extractor-ctf-20260216a.knieclarine.workers.dev/extract');
    u.searchParams.set('entry', 'https://www.czzymovie.com/');
    u.searchParams.set('max_vplay', '2');
    const r = await fetchJsonWithTimeoutNoThrow(u.toString(), WORKER_TIMEOUT_MS);
    if (r.status === 200 && r.body && r.body.ok === true) {
        const sources = uniq(r.body.allPlaybackSources || []);
        const subtitles = uniq(r.body.allSubtitles || []);
        if (sources.length) {
            return {sources, subtitles, note: 'worker_ok=true'};
        }
    }
    return {
        sources: SOURCE_FALLBACK.cz233,
        subtitles: [],
        note: `worker_unavailable(status=${r.status}) fallback_static=true`,
    };
}

async function extractBgm() {
    const u = new URL('https://bgm-ctf-extractor.knieclarine.workers.dev/extract');
    u.searchParams.set('entry', 'https://bgm.girigirilove.com/GV26896/');
    u.searchParams.set('limit', '12');
    const r = await fetchJsonWithTimeoutNoThrow(u.toString(), WORKER_TIMEOUT_MS);
    if (r.status === 200 && r.body && Array.isArray(r.body.results)) {
        const good = r.body.results.filter((x) => x && typeof x.m3u8_url === 'string' && x.m3u8_url);
        const sources = uniq(good.map((x) => x.m3u8_url));
        const subtitles = uniq(good.map((x) => x.subtitle_url).filter(Boolean));
        if (sources.length) {
            return {sources, subtitles, note: `worker_ok=true count=${sources.length}`};
        }
    }
    return {
        sources: SOURCE_FALLBACK.bgm,
        subtitles: [],
        note: `worker_unavailable(status=${r.status}) fallback_static=true`,
    };
}

async function extractKvm4(paths) {
    const u = new URL('https://kvmtv-ctf-extractor-20260216.knieclarine.workers.dev/extract');
    u.searchParams.set('target', 'https://www.4kvm.tv/movies/hsbdla');
    u.searchParams.set('include_subtitle', '1');
    const r = await fetchJsonWithTimeoutNoThrow(u.toString(), WORKER_TIMEOUT_MS);
    if (r.status === 200 && r.body && r.body.ok === true && r.body.result) {
        const result = r.body.result;
        const sources = uniq([result.play_url, result.source, result.master].filter(Boolean));
        const subtitles = uniq([
            ...(Array.isArray(result.hls_subtitles) ? result.hls_subtitles : []),
            result.subtitle_url,
            result.danmu_url,
        ].filter(Boolean));
        if (sources.length) {
            return {sources, subtitles, note: 'worker_ok=true'};
        }
    }

    const snap = safeJson(paths.kvm4Snapshot);
    const snapSources = uniq([snap?.play_url, snap?.source, snap?.master].filter(Boolean));
    const snapSubtitles = uniq([
        ...(Array.isArray(snap?.hls_subtitles) ? snap.hls_subtitles : []),
        snap?.subtitle_url,
        snap?.danmu_url,
    ].filter(Boolean));
    if (snapSources.length) {
        return {
            sources: snapSources,
            subtitles: snapSubtitles,
            note: `worker_unavailable(status=${r.status}) fallback_snapshot=true`,
        };
    }

    return {
        sources: SOURCE_FALLBACK.kvm4,
        subtitles: [],
        note: `worker_unavailable(status=${r.status}) fallback_static=true`,
    };
}

async function extractLibvio(context) {
    const workspaceRoot = context.workspaceRoot;
    const rootDir = context.rootDir;
    const lastGood = loadLibvioLastGood(rootDir);
    const parsed = runNodeJson(
        workspaceRoot,
        [path.join('libvio', 'ctf_libvio.js'), '--play', 'https://www.libvio.site/play/714893137-4-1.html', '--json'],
    );

    if (parsed && typeof parsed === 'object') {
        const variantUrls = Array.isArray(parsed?.debug?.variants)
            ? parsed.debug.variants.map((x) => (x && typeof x.url === 'string' ? x.url : ''))
            : [];
        const sources = uniq([parsed.source, parsed.master, ...variantUrls].filter(isMediaUrl));
        const nonExpired = sources.filter((u) => !isExpiredSignedUrl(u));
        const subtitles = uniq((Array.isArray(parsed.subtitles) ? parsed.subtitles : []).filter(Boolean));
        if (nonExpired.length) {
            saveLibvioLastGood(rootDir, nonExpired, subtitles, 'from_node_script');
            return {sources: nonExpired, subtitles, note: 'local_script_ok=true'};
        }
    }

    const capture = runPythonCaptureUrls(workspaceRoot);
    if (capture.ok) {
        const freshUrls = uniq((capture.urls || []).filter(isMediaUrl)).filter((u) => !isExpiredSignedUrl(u));
        const subtitles = uniq((capture.subtitles || []).filter(isSubtitleUrl));
        if (freshUrls.length) {
            saveLibvioLastGood(rootDir, freshUrls, subtitles, 'from_python_capture');
            return {
                sources: freshUrls,
                subtitles,
                note: capture.note,
            };
        }
    }

    if (lastGood && lastGood.sources.length) {
        return {
            sources: lastGood.sources,
            subtitles: lastGood.subtitles,
            note: `last_good_cache=true age_s=${lastGood.ageSec} ${capture.note}`,
        };
    }

    const fallback = uniq((SOURCE_FALLBACK.libvio || []).filter((u) => !isExpiredSignedUrl(u)));
    return {
        sources: fallback,
        subtitles: [],
        note: `local_script_unavailable fallback_static=true ${capture.note}`,
    };
}

async function extractKanbot(paths) {
    const u = new URL('https://ikanbot-ctf-extractor.knieclarine.workers.dev/extract');
    u.searchParams.set('play_url', 'https://v.ikanbot.com/play/962794');
    u.searchParams.set('max_depth', '2');
    const r = await fetchJsonWithTimeoutNoThrow(u.toString(), WORKER_TIMEOUT_MS);
    if (r.status === 200 && r.body && r.body.ok === true) {
        const fromWorker = uniq([
            ...(Array.isArray(r.body.final_playlists) ? r.body.final_playlists : []),
            ...(Array.isArray(r.body.sources) ? r.body.sources.map((x) => (x ? x.url : '')) : []),
        ].filter(isMediaUrl));
        if (fromWorker.length) {
            return {
                sources: fromWorker,
                subtitles: uniq(Array.isArray(r.body.subtitle_urls) ? r.body.subtitle_urls : []),
                note: 'worker_ok=true',
            };
        }
    }

    const snap = safeJson(paths.kanbotSnapshot);
    const snapSources = uniq([
        ...(Array.isArray(snap?.final_playlists) ? snap.final_playlists : []),
        ...(Array.isArray(snap?.sources) ? snap.sources.map((x) => (x ? x.url : '')) : []),
    ].filter(isMediaUrl));
    if (snapSources.length) {
        return {
            sources: snapSources,
            subtitles: uniq(Array.isArray(snap?.subtitle_urls) ? snap.subtitle_urls : []),
            note: `worker_unavailable(status=${r.status}) fallback_snapshot=true`,
        };
    }

    return {
        sources: SOURCE_FALLBACK.kanbot,
        subtitles: [],
        note: `worker_unavailable(status=${r.status}) fallback_static=true`,
    };
}

async function extractKuangren(paths) {
    const dbg = safeJson(paths.kuangrenDbg);
    const flag = safeJson(paths.kuangrenFlag);

    const candidates = [];
    if (dbg) {
        candidates.push(dbg.source);
        candidates.push(dbg.cf);
        candidates.push(asAbsUrl(dbg.hlsVideoTiktok, 'https://soul.ezplayer.me'));
        candidates.push(asAbsUrl(dbg.hlsVideoGoogle, 'https://soul.ezplayer.me'));
    }
    if (flag) {
        candidates.push(flag.main_source);
        if (Array.isArray(flag.source_candidates)) {
            for (const one of flag.source_candidates) {
                candidates.push(one && one.src ? one.src : '');
            }
        }
    }

    const sources = uniq(candidates.filter(isMediaUrl));
    const subtitles = uniq([
        asAbsUrl(dbg?.thumbnail, 'https://soul.ezplayer.me'),
        asAbsUrl(dbg?.thumbnail_vtt, 'https://soul.ezplayer.me'),
        ...(Array.isArray(flag?.subtitles) ? flag.subtitles : []),
    ].filter(isSubtitleUrl));

    if (sources.length) {
        return {sources, subtitles, note: 'snapshot_dbgE_ok=true'};
    }

    return {
        sources: SOURCE_FALLBACK.kuangren,
        subtitles,
        note: 'snapshot_dbgE_unavailable fallback_static=true',
    };
}

async function extractDbkk(paths) {
    const snap = loadLatestDbkkOutJson(paths);
    const source = snap?.localRun?.source || '';
    const subtitles = [];
    const rawSubs = snap?.localRun?.subtitles;
    if (Array.isArray(rawSubs)) subtitles.push(...rawSubs);
    if (typeof rawSubs === 'string' && rawSubs && rawSubs !== 'NONE') subtitles.push(rawSubs);

    if (isMediaUrl(source)) {
        return {
            sources: [source],
            subtitles: uniq(subtitles.filter(isSubtitleUrl)),
            note: 'snapshot_e2e_ok=true',
        };
    }

    return {
        sources: SOURCE_FALLBACK.dbkk,
        subtitles: uniq(subtitles.filter(isSubtitleUrl)),
        note: 'snapshot_e2e_unavailable fallback_static=true',
    };
}

async function extractIyf(paths) {
    const all = [];
    for (const filePath of paths.iyfSourceFiles) {
        all.push(...extractMediaUrls(safeText(filePath)));
    }
    const sources = uniq(all);
    if (sources.length) {
        return {sources, subtitles: [], note: 'snapshot_files_ok=true'};
    }
    return {
        sources: SOURCE_FALLBACK.iyf,
        subtitles: [],
        note: 'snapshot_files_unavailable fallback_static=true',
    };
}

async function extractAiyifan(paths) {
    const all = [];
    for (const filePath of paths.aiyifanSourceFiles) {
        all.push(...extractMediaUrls(safeText(filePath)));
    }
    const sources = uniq(all);
    if (sources.length) {
        return {sources, subtitles: [], note: 'snapshot_files_ok=true'};
    }
    return {
        sources: SOURCE_FALLBACK.aiyifan,
        subtitles: [],
        note: 'snapshot_files_unavailable fallback_static=true',
    };
}

async function extractBySite(siteId, context) {
    if (siteId === 'kvm4') return extractKvm4(context.paths);
    if (siteId === 'cz233') return extractCz233();
    if (siteId === 'netflixgc') return extractNetflixgc();
    if (siteId === 'ysxq') return extractYsxq(context.paths);
    if (siteId === 'dbkk') return extractDbkk(context.paths);
    if (siteId === 'aiyifan') return extractAiyifan(context.paths);
    if (siteId === 'bgm') return extractBgm();
    if (siteId === 'kuangren') return extractKuangren(context.paths);
    if (siteId === 'kanbot') return extractKanbot(context.paths);
    if (siteId === 'iyf') return extractIyf(context.paths);
    if (siteId === 'libvio') return extractLibvio(context);
    throw new Error(`unsupported site: ${siteId}`);
}

async function resolveSiteSources(siteId, context) {
    const ttlMs = Number(process.env.CTF_LOCAL_ADAPTER_CACHE_MS || 5 * 60 * 1000);
    const now = Date.now();
    const hit = cache.get(siteId);
    if (hit && now - hit.ts < ttlMs) return hit.data;

    const raw = await extractBySite(siteId, context);
    const data = await finalizeSiteData(siteId, raw);
    cache.set(siteId, {ts: now, data});
    return data;
}

function mkVod(siteId, sourceUrls, subtitles, note) {
    const meta = SITE_META[siteId];
    const fromName = 'CTF-Direct';
    const playLines = sourceUrls.map((u, i) => `Line${i + 1}$${u}`);
    const subLine = uniq(subtitles || []);
    const extra = subLine.length ? `subs(${subLine.length}): ${subLine.slice(0, 5).join(' | ')}` : 'subs: none';
    const remarkParts = [note || '', extra].filter(Boolean);
    return {
        vod_id: `${siteId}_1`,
        vod_name: meta.movieName,
        vod_pic: meta.icon || '',
        type_name: meta.typeName,
        vod_remarks: remarkParts.join(' ; '),
        vod_content: `entry: ${meta.entryHint} ; refreshed_at: ${nowIso()}`,
        vod_play_from: fromName,
        vod_play_url: playLines.join('#'),
    };
}

function toInt(v, dft) {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : dft;
}

function maccmsListPayload(vods, pg = 1, limit = 20) {
    const total = vods.length;
    const pagecount = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(Math.max(1, pg), pagecount);
    const start = (page - 1) * limit;
    const list = vods.slice(start, start + limit);
    return {
        code: 1,
        msg: 'ok',
        page: String(page),
        pagecount: String(pagecount),
        limit: String(limit),
        total: String(total),
        list,
    };
}

function maccmsHomePayload(siteId, vod) {
    const meta = SITE_META[siteId];
    return {
        code: 1,
        msg: 'ok',
        class: [{type_id: '1', type_name: meta.typeName}],
        filters: {},
        list: vod ? [vod] : [],
    };
}

function maccmsPlayPayload(vod) {
    const firstLine = String(vod?.vod_play_url || '').split('#')[0] || '';
    const firstUrl = firstLine.split('$').slice(1).join('$') || '';
    return {
        code: 1,
        msg: 'ok',
        parse: 0,
        header: '',
        url: firstUrl,
    };
}

export default (fastify, options, done) => {
    const rootDir = path.resolve(options.rootDir || process.cwd());
    const resolvedWorkspace = resolveWorkspaceRoot(rootDir);
    const workspaceRoot = resolvedWorkspace.root;
    const paths = {
        ysxqSnapshot: path.resolve(workspaceRoot, CHN_BOJU, 'main', 'result-116295-1-1.json'),
        kvm4Snapshot: path.resolve(workspaceRoot, '.4kvm.tv', 'main', 'report', 'result.json'),
        kanbotSnapshot: path.resolve(workspaceRoot, 'kanbot.com', 'main', 'artifacts', 'worker_extract.json'),
        kuangrenFlag: path.resolve(workspaceRoot, 'kuangren.us', 'main', 'flag.json'),
        kuangrenDbg: path.resolve(workspaceRoot, 'kuangren.us', 'main', 'dbg_E.json'),
        dbkkOutDir: path.resolve(workspaceRoot, CHN_DBKK, 'main', 'out'),
        iyfSourceFiles: [
            path.resolve(workspaceRoot, 'iyf.tv', 'out_protocol_rHdszVLeZIT_live_now_source_urls.txt'),
            path.resolve(workspaceRoot, 'iyf.tv', 'out_protocol_rHdszVLeZIT_real_source_urls.txt'),
            path.resolve(workspaceRoot, 'iyf.tv', 'out_source_rHdszVLeZIT_now_links.txt'),
        ],
        aiyifanSourceFiles: [
            path.resolve(workspaceRoot, 'aiyifan', 'ctf', 'play_channel_chrome.json'),
            path.resolve(workspaceRoot, 'aiyifan', 'ctf', 'play_channel_msedge.json'),
            path.resolve(workspaceRoot, 'aiyifan', 'ctf', 'play_api_now.json'),
            path.resolve(workspaceRoot, 'aiyifan', 'ctf', 'play_api_576_now.json'),
            path.resolve(workspaceRoot, 'aiyifan', 'ctf', 'play_api_720_now.json'),
            path.resolve(workspaceRoot, 'aiyifan', 'worker-bonus', 'tmp_fetch_regression.json'),
        ],
    };
    const context = {workspaceRoot, rootDir, paths};

    const buildRequestHost = (request) => `${request.protocol}://${request.headers.host}`;

    fastify.get('/ctf-adapter/health', async (request) => {
        return {
            ok: true,
            service: 'ctf-local-adapter',
            now: nowIso(),
            all_site_count: ALL_SITE_IDS.length,
            site_count: SITE_IDS.length,
            site_ids: SITE_IDS,
            disabled_default_site_ids: [...DEFAULT_DISABLED_SITE_IDS],
            workspace_root: workspaceRoot,
            workspace_source: resolvedWorkspace.source,
            workspace_markers: resolvedWorkspace.markers,
        };
    });

    fastify.get('/ctf-adapter/sites', async (request) => {
        const requestHost = buildRequestHost(request);
        const pwd = process.env.API_PWD || '';
        return {
            ok: true,
            sites: SITE_IDS.map((siteId) => {
                const meta = SITE_META[siteId];
                let api = `${requestHost}/ctf-adapter/api/${siteId}`;
                if (pwd) {
                    api += `?pwd=${pwd}`;
                }
                return {
                    id: siteId,
                    key: meta.key,
                    name: meta.name,
                    type: 4,
                    api,
                    entryHint: meta.entryHint,
                };
            }),
        };
    });

    fastify.get('/ctf-adapter/api/:siteId', {preHandler: validatePwd}, async (request, reply) => {
        const siteId = String(request.params.siteId || '').trim();
        if (!SITE_IDS.includes(siteId)) {
            return reply.code(404).send({code: 0, msg: 'site_not_found'});
        }

        const ac = String(request.query.ac || '').toLowerCase();
        const wd = String(request.query.wd || '').trim().toLowerCase();
        const ids = String(request.query.ids || '').trim();
        const pg = toInt(request.query.pg, 1);
        const limit = toInt(request.query.limit, 20);

        try {
            const src = await resolveSiteSources(siteId, context);
            const vod = mkVod(siteId, src.sources, src.subtitles, src.note);
            let items = [vod];

            if (wd) {
                items = items.filter((x) => String(x.vod_name || '').toLowerCase().includes(wd));
            }
            if (ids) {
                const idSet = new Set(ids.split(',').map((x) => x.trim()).filter(Boolean));
                items = items.filter((x) => idSet.has(String(x.vod_id)));
            }

            if (!ac) {
                return maccmsHomePayload(siteId, vod);
            }
            if (ac === 'home') {
                return maccmsHomePayload(siteId, vod);
            }
            if (ac === 'search') {
                return maccmsListPayload(items, pg, limit);
            }
            if (ac === 'detail' || ac === 'list' || ac === 'videolist') {
                return maccmsListPayload(items, pg, limit);
            }
            if (ac === 'play') {
                return maccmsPlayPayload(vod);
            }

            return maccmsHomePayload(siteId, vod);
        } catch (error) {
            return reply.code(500).send({
                code: 0,
                msg: 'extract_failed',
                site: siteId,
                error: cut(error.message || String(error), 200),
            });
        }
    });

    done();
};
