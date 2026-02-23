import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import net from 'net';
import {spawn, spawnSync} from 'child_process';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const DEFAULT_PORT = Number(process.env.CTF_LOCAL_TEST_PORT || 5757);
const DEFAULT_TIMEOUT_MS = Number(process.env.CTF_LOCAL_TEST_TIMEOUT_MS || 18000);
const DEFAULT_CONCURRENCY = Number(process.env.CTF_LOCAL_TEST_CONCURRENCY || 6);

const nowIso = () => new Date().toISOString();
const fmt = (d = new Date()) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
const cut = (s, n = 260) => (s === undefined || s === null ? '' : String(s).replace(/\r?\n/g, ' ').slice(0, n));
const safeName = (x) => String(x || '').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'source';

function parseArgs(argv) {
    const out = {
        port: DEFAULT_PORT,
        timeoutMs: DEFAULT_TIMEOUT_MS,
        concurrency: DEFAULT_CONCURRENCY,
        pwd: process.env.API_PWD || '',
    };
    for (const a of argv) {
        if (a.startsWith('--port=')) out.port = Number(a.split('=').slice(1).join('=')) || out.port;
        else if (a.startsWith('--timeout=')) out.timeoutMs = Number(a.split('=').slice(1).join('=')) || out.timeoutMs;
        else if (a.startsWith('--concurrency=')) out.concurrency = Number(a.split('=').slice(1).join('=')) || out.concurrency;
        else if (a.startsWith('--pwd=')) out.pwd = a.split('=').slice(1).join('=');
    }
    if (out.concurrency < 1) out.concurrency = 1;
    return out;
}

function tcpOpen(host, port, timeout = 1500) {
    return new Promise((resolve) => {
        const s = new net.Socket();
        let done = false;
        const finish = (open) => {
            if (done) return;
            done = true;
            try {
                s.destroy();
            } catch {
            }
            resolve(open);
        };
        s.setTimeout(timeout);
        s.once('connect', () => finish(true));
        s.once('timeout', () => finish(false));
        s.once('error', () => finish(false));
        s.connect(port, host);
    });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitHttp(url, timeoutMs = 80_000) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
        try {
            const r = await fetch(url);
            if (r.status < 500) return true;
        } catch {
        }
        await sleep(500);
    }
    return false;
}

async function req(url, timeoutMs = DEFAULT_TIMEOUT_MS, options = {}) {
    const c = new AbortController();
    const t0 = Date.now();
    const timer = setTimeout(() => c.abort(), timeoutMs);
    try {
        const res = await fetch(url, {signal: c.signal, ...options});
        const text = await res.text();
        let json = null;
        try {
            json = JSON.parse(text);
        } catch {
        }
        return {
            ok: res.ok,
            status: res.status,
            headers: Object.fromEntries(res.headers.entries()),
            text,
            json,
            durationMs: Date.now() - t0,
            error: '',
        };
    } catch (e) {
        return {
            ok: false,
            status: -1,
            headers: {},
            text: '',
            json: null,
            durationMs: Date.now() - t0,
            error: e.message || String(e),
        };
    } finally {
        clearTimeout(timer);
    }
}

async function probePlayable(url, timeoutMs = 12_000) {
    if (!url) return {ok: false, reason: 'empty_url'};
    const headers = /\.mp4(?:\?|$)/i.test(url) ? {Range: 'bytes=0-4095'} : {};
    const r = await req(url, timeoutMs, {headers, redirect: 'follow'});
    if (r.error) {
        const byCurl = probePlayableByCurl(url, timeoutMs);
        if (byCurl.ok) return byCurl;
        const combined = byCurl.reason ? `${r.error}; ${byCurl.reason}` : r.error;
        return {ok: false, reason: combined, status: byCurl.status || r.status};
    }
    if (r.status < 200 || r.status >= 400) {
        return {ok: false, reason: `HTTP ${r.status}`, status: r.status};
    }
    const contentType = String(r.headers?.['content-type'] || '').toLowerCase();
    if (/(mpegurl|video|mp4|dash|octet-stream)/i.test(contentType)) {
        return {ok: true, reason: `content-type=${contentType}`, status: r.status};
    }
    const sample = String(r.text || '').slice(0, 160);
    const looksHls = /#EXTM3U/i.test(sample);
    const looksMpd = /<MPD/i.test(sample);
    const looksMp4 = /ftyp/i.test(sample);
    if (looksHls || looksMpd || looksMp4 || /\.mp4(?:\?|$)/i.test(url) || /\.m3u8(?:\?|$)/i.test(url)) {
        return {ok: true, reason: 'stream_signature_matched', status: r.status};
    }
    return {ok: false, reason: 'signature_not_matched', status: r.status, sample: cut(sample, 140)};
}

function probePlayableByCurl(url, timeoutMs = 12_000) {
    const target = String(url || '').trim();
    if (!target) return {ok: false, reason: 'curl_empty_url', status: -1};
    const timeoutSec = Math.max(4, Math.ceil(Math.min(timeoutMs, 24_000) / 1000));
    const out = spawnSync('curl', [
        '-L',
        '--max-time', String(timeoutSec),
        '-sS',
        '-o', '/dev/null',
        '-w', '%{http_code}|%{content_type}',
        target,
    ], {
        encoding: 'utf8',
        timeout: Math.min(timeoutMs + 3_000, 28_000),
        maxBuffer: 1024 * 64,
    });
    if (out.error || out.status !== 0) {
        const reason = out.error ? (out.error.message || String(out.error)) : `curl_exit_${out.status}`;
        return {ok: false, reason: `curl_failed:${reason}`, status: -1};
    }
    const text = String(out.stdout || '').trim();
    const [statusText, ctRaw = ''] = text.split('|');
    const status = Number(statusText);
    if (!Number.isFinite(status)) return {ok: false, reason: `curl_bad_status:${statusText}`, status: -1};
    if (status < 200 || status >= 400) return {ok: false, reason: `curl HTTP ${status}`, status};
    const contentType = String(ctRaw || '').toLowerCase();
    if (/(mpegurl|video|mp4|dash|octet-stream)/i.test(contentType)) {
        return {ok: true, reason: `curl content-type=${contentType || '-'}`, status};
    }
    if (/\.(m3u8|mp4|mpd)(\?|$)/i.test(target) || /manifest\.mpd/i.test(target)) {
        return {ok: true, reason: `curl extension_probe status=${status}`, status};
    }
    return {ok: false, reason: `curl signature_not_matched status=${status}`, status};
}

function parseVodUrls(vod) {
    const play = String(vod?.vod_play_url || '').trim();
    if (!play) return [];
    const rows = play.split('#').map((x) => String(x || '').trim()).filter(Boolean);
    const urls = rows.map((row) => row.split('$').slice(1).join('$').trim()).filter(Boolean);
    return Array.from(new Set(urls));
}

async function runPool(items, worker, concurrency) {
    const results = new Array(items.length);
    let cursor = 0;

    async function runner() {
        while (true) {
            const idx = cursor++;
            if (idx >= items.length) return;
            results[idx] = await worker(items[idx], idx);
        }
    }

    await Promise.all(new Array(Math.min(concurrency, items.length)).fill(0).map(() => runner()));
    return results;
}

function evaluateSite(result) {
    const apiPass = result.home.ok && result.list.ok && result.search.ok && result.detail.ok && result.play.ok;
    if (apiPass && result.stream.ok) return 'success';
    if (apiPass && !result.stream.ok) return 'pending';
    return 'error';
}

function sourceMd(s) {
    const lines = [];
    lines.push(`# ctf_local 验证报告 - ${s.name}`);
    lines.push('');
    lines.push(`- id: ${s.id}`);
    lines.push(`- key: ${s.key}`);
    lines.push(`- status: ${s.status}`);
    lines.push(`- api: ${s.api}`);
    lines.push(`- firstPlayableUrl: ${s.firstPlayableUrl || ''}`);
    lines.push(`- streamProbe: ${s.stream.ok ? 'ok' : 'fail'} | ${s.stream.reason || ''}`);
    lines.push('');
    lines.push('## 接口检查');
    const rows = [
        ['home', s.home],
        ['list', s.list],
        ['search', s.search],
        ['detail', s.detail],
        ['play', s.play],
    ];
    rows.forEach(([name, one]) => {
        lines.push(`- ${name}: ${one.ok ? 'ok' : 'fail'} | status=${one.status} | ${cut(one.message || one.error || '', 180)} | ${one.url}`);
    });
    lines.push('');
    lines.push('## 人工复核');
    lines.push('- [ ] 在播放器中导入该源并进入详情页');
    lines.push('- [ ] 校验首条播放线路可起播且无明显花屏/卡顿');
    lines.push('- [ ] 校验切换线路后仍可起播');
    const tested = Array.isArray(s.stream?.tested) ? s.stream.tested : [];
    if (tested.length > 0) {
        lines.push('');
        lines.push('## 自动探测线路');
        tested.forEach((x, i) => {
            lines.push(`- ${i + 1}. ${x.ok ? 'ok' : 'fail'} | status=${x.status} | ${x.reason || ''} | ${x.url}`);
        });
    }
    lines.push('- 备注:');
    return lines.join('\n');
}

function summaryMd(ctx) {
    const lines = [];
    lines.push('# ctf_local 全量并发验证汇总');
    lines.push('');
    lines.push(`- batch: ${ctx.batch}`);
    lines.push(`- startedAt: ${ctx.startedAt}`);
    lines.push(`- finishedAt: ${ctx.finishedAt}`);
    lines.push(`- port: ${ctx.port}`);
    lines.push(`- total: ${ctx.total}`);
    lines.push(`- success: ${ctx.success}`);
    lines.push(`- pending: ${ctx.pending}`);
    lines.push(`- error: ${ctx.error}`);
    lines.push('');
    lines.push('| id | name | status | api_ms | list_ms | detail_ms | play_ms | stream |');
    lines.push('|---|---|---|---:|---:|---:|---:|---|');
    ctx.sources.forEach((s) => {
        lines.push(`| ${s.id} | ${cut(s.name, 48)} | ${s.status} | ${s.home.durationMs} | ${s.list.durationMs} | ${s.detail.durationMs} | ${s.play.durationMs} | ${s.stream.ok ? 'ok' : 'fail'} |`);
    });
    lines.push('');
    lines.push('## 结论');
    lines.push('- success: 接口链路与首条播放链接探测通过。');
    lines.push('- pending: 接口链路通过，但首条播放链接探测失败，需人工播放器终验。');
    lines.push('- error: 接口链路存在失败项。');
    return lines.join('\n');
}

function manualChecklistMd(sources) {
    const lines = [];
    lines.push('# ctf_local 人工复核清单');
    lines.push('');
    sources.forEach((s, idx) => {
        lines.push(`## ${idx + 1}. ${s.name}`);
        lines.push(`- id: ${s.id}`);
        lines.push(`- status: ${s.status}`);
        lines.push(`- api: ${s.api}`);
        lines.push(`- firstPlayableUrl: ${s.firstPlayableUrl || ''}`);
        lines.push('- [ ] 已在客户端导入验证');
        lines.push('- [ ] 首页可打开');
        lines.push('- [ ] 详情可打开');
        lines.push('- [ ] 线路1可播放');
        lines.push('- [ ] 切线可播放');
        lines.push('- 备注:');
        lines.push('');
    });
    return lines.join('\n');
}

function buildApiUrl(baseApi, pwd, query = {}) {
    const u = new URL(baseApi);
    if (pwd) {
        u.searchParams.set('pwd', pwd);
    }
    Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
            u.searchParams.set(k, String(v));
        }
    });
    return u.toString();
}

async function testSite(site, args) {
    const baseApi = site.api || '';
    const homeUrl = buildApiUrl(baseApi, args.pwd, {});
    const homeRes = await req(homeUrl, args.timeoutMs);
    const homeJson = homeRes.json || {};
    const homeOk = homeRes.ok && homeJson && homeJson.code === 1;

    const listUrl = buildApiUrl(baseApi, args.pwd, {ac: 'list', t: 1, pg: 1});
    const listRes = await req(listUrl, args.timeoutMs);
    const listJson = listRes.json || {};
    const listOk = listRes.ok && listJson && listJson.code === 1 && Array.isArray(listJson.list);

    const detailId = (listJson.list && listJson.list[0] && listJson.list[0].vod_id) || `${site.id}_1`;
    const searchUrl = buildApiUrl(baseApi, args.pwd, {ac: 'search', wd: 'test'});
    const detailUrl = buildApiUrl(baseApi, args.pwd, {ac: 'detail', ids: detailId});
    const playUrl = buildApiUrl(baseApi, args.pwd, {ac: 'play', id: detailId});

    const [searchRes, detailRes, playRes] = await Promise.all([
        req(searchUrl, args.timeoutMs),
        req(detailUrl, args.timeoutMs),
        req(playUrl, args.timeoutMs),
    ]);
    const searchJson = searchRes.json || {};
    const detailJson = detailRes.json || {};
    const playJson = playRes.json || {};
    const searchOk = searchRes.ok && searchJson && searchJson.code === 1;
    const detailOk = detailRes.ok && detailJson && detailJson.code === 1 && Array.isArray(detailJson.list);
    const playOk = playRes.ok && playJson && playJson.code === 1;

    const vod = (detailJson.list && detailJson.list[0]) || (listJson.list && listJson.list[0]) || null;
    const probeCandidates = Array.from(new Set([
        ...parseVodUrls(vod),
        String(playJson.url || '').trim(),
    ].filter(Boolean))).slice(0, 3);

    let stream = {ok: false, reason: 'no_candidate', status: -1, tested: []};
    let firstPlayableUrl = probeCandidates[0] || '';
    for (const candidate of probeCandidates) {
        const one = await probePlayable(candidate, Math.min(args.timeoutMs, 14_000));
        stream.tested.push({url: candidate, ok: one.ok, reason: one.reason || '', status: one.status || -1});
        if (one.ok) {
            stream = {...one, tested: stream.tested};
            firstPlayableUrl = candidate;
            break;
        }
        stream = {...one, tested: stream.tested};
    }

    return {
        id: site.id,
        key: site.key || site.id,
        name: site.name || site.id,
        api: baseApi,
        home: {
            ok: homeOk,
            status: homeRes.status,
            durationMs: homeRes.durationMs,
            message: homeOk ? 'code=1' : cut(homeRes.error || homeRes.text, 140),
            url: homeUrl,
        },
        list: {
            ok: listOk,
            status: listRes.status,
            durationMs: listRes.durationMs,
            message: listOk ? `items=${(listJson.list || []).length}` : cut(listRes.error || listRes.text, 140),
            url: listUrl,
        },
        search: {
            ok: searchOk,
            status: searchRes.status,
            durationMs: searchRes.durationMs,
            message: searchOk ? `items=${(searchJson.list || []).length}` : cut(searchRes.error || searchRes.text, 140),
            url: searchUrl,
        },
        detail: {
            ok: detailOk,
            status: detailRes.status,
            durationMs: detailRes.durationMs,
            message: detailOk ? `items=${(detailJson.list || []).length}` : cut(detailRes.error || detailRes.text, 140),
            url: detailUrl,
        },
        play: {
            ok: playOk,
            status: playRes.status,
            durationMs: playRes.durationMs,
            message: playOk ? 'code=1' : cut(playRes.error || playRes.text, 140),
            url: playUrl,
        },
        firstPlayableUrl,
        stream,
    };
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const startedAt = nowIso();
    const batch = fmt();
    const reportDir = path.join(ROOT, 'reports', 'ctf-local-adapter-validation', batch);
    await fsp.mkdir(reportDir, {recursive: true});

    const BASE = `http://127.0.0.1:${args.port}`;
    const serviceOpen = await tcpOpen('127.0.0.1', args.port, 2000);
    let child = null;
    let reusedService = serviceOpen;

    if (!serviceOpen) {
        child = spawn(process.execPath, ['index.js'], {
            cwd: ROOT,
            env: {
                ...process.env,
                PORT: String(args.port),
                API_PWD: args.pwd || process.env.API_PWD || '',
            },
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        const stdoutPath = path.join(reportDir, 'runtime.stdout.log');
        const stderrPath = path.join(reportDir, 'runtime.stderr.log');
        const outStream = fs.createWriteStream(stdoutPath, {encoding: 'utf8'});
        const errStream = fs.createWriteStream(stderrPath, {encoding: 'utf8'});
        child.stdout?.pipe(outStream);
        child.stderr?.pipe(errStream);
        const ok = await waitHttp(`${BASE}/health`, 90_000);
        if (!ok) {
            throw new Error('drpy-node startup timeout');
        }
    }

    try {
        const siteResp = await req(`${BASE}/ctf-adapter/sites`, args.timeoutMs);
        if (!siteResp.ok || !siteResp.json || !Array.isArray(siteResp.json.sites)) {
            throw new Error(`failed to fetch /ctf-adapter/sites: ${siteResp.status} ${cut(siteResp.text, 180)}`);
        }

        const sites = siteResp.json.sites.map((s) => ({
            id: String(s.id || ''),
            key: String(s.key || ''),
            name: String(s.name || ''),
            api: String(s.api || ''),
        })).filter((s) => s.id && s.api);

        const results = await runPool(sites, async (site) => testSite(site, args), args.concurrency);
        const normalized = results.map((x) => ({...x, status: evaluateSite(x)}));

        let success = 0;
        let pending = 0;
        let error = 0;
        normalized.forEach((x) => {
            if (x.status === 'success') success += 1;
            else if (x.status === 'pending') pending += 1;
            else error += 1;
        });

        await fsp.writeFile(path.join(reportDir, 'raw-results.json'), JSON.stringify({
            meta: {
                batch,
                startedAt,
                finishedAt: nowIso(),
                port: args.port,
                timeoutMs: args.timeoutMs,
                concurrency: args.concurrency,
                reusedService,
            },
            summary: {total: normalized.length, success, pending, error},
            sources: normalized,
        }, null, 2), 'utf8');

        await Promise.all(normalized.map((s) =>
            fsp.writeFile(path.join(reportDir, `source-${safeName(s.id)}.md`), sourceMd(s), 'utf8'),
        ));

        const finishedAt = nowIso();
        await fsp.writeFile(path.join(reportDir, 'summary.md'), summaryMd({
            batch,
            startedAt,
            finishedAt,
            port: args.port,
            total: normalized.length,
            success,
            pending,
            error,
            sources: normalized,
        }), 'utf8');
        await fsp.writeFile(path.join(reportDir, 'manual-checklist.md'), manualChecklistMd(normalized), 'utf8');

        console.log(`[ctf-local-adapter-validation] reportDir=${reportDir}`);
        console.log(`[ctf-local-adapter-validation] total=${normalized.length}, success=${success}, pending=${pending}, error=${error}`);
    } finally {
        if (child) {
            child.kill('SIGTERM');
            await sleep(1200);
            if (!child.killed) {
                child.kill('SIGKILL');
            }
        }
    }
}

main().catch((e) => {
    console.error('[ctf-local-adapter-validation] failed:', e);
    process.exit(1);
});
