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
const DEFAULT_TIMEOUT_MS = Number(process.env.CTF_LOCAL_TEST_TIMEOUT_MS || 30000);
const DEFAULT_CONCURRENCY = Number(process.env.CTF_LOCAL_TEST_CONCURRENCY || 4);

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
    const requiredTotal = result.checks.filter((c) => c.required).length;
    const requiredFailed = result.checks.filter((c) => c.required && !c.ok).length;
    return {
        status: requiredFailed === 0 ? 'success' : 'error',
        requiredTotal,
        requiredPassed: requiredTotal - requiredFailed,
        requiredFailed,
    };
}

function sourceMd(s) {
    const lines = [];
    lines.push(`# ctf_local 严格验证报告 - ${s.name}`);
    lines.push('');
    lines.push(`- id: ${s.id}`);
    lines.push(`- key: ${s.key}`);
    lines.push(`- status: ${s.status}`);
    lines.push(`- requiredChecks: ${s.requiredPassed}/${s.requiredTotal}`);
    lines.push(`- api: ${s.api}`);
    lines.push(`- searchKeyword: ${s.searchKeyword}`);
    lines.push(`- firstPlayableUrl: ${s.firstPlayableUrl || ''}`);
    lines.push('');
    lines.push('## 严格断言结果');
    s.checks.forEach((c) => {
        lines.push(`- [${c.ok ? 'PASS' : 'FAIL'}] ${c.id} | required=${c.required} | status=${c.status} | ${cut(c.message, 180)} | ${c.url}`);
    });
    lines.push('');
    lines.push('## 自动探测线路');
    const probes = Array.isArray(s.stream?.probes) ? s.stream.probes : [];
    probes.forEach((x, i) => {
        lines.push(`- ${i + 1}. ${x.ok ? 'ok' : 'fail'} | status=${x.status} | ${x.reason || ''} | ${x.url}`);
    });
    lines.push('');
    lines.push('## 人工复核');
    lines.push('- [ ] 已在客户端导入验证');
    lines.push('- [ ] 首页可打开');
    lines.push('- [ ] 搜索可命中');
    lines.push('- [ ] 分页行为正确');
    lines.push('- [ ] 详情可打开');
    lines.push('- [ ] 播放可起播');
    lines.push('- [ ] 切线可起播');
    lines.push('- 备注:');
    return lines.join('\n');
}

function summaryMd(ctx) {
    const lines = [];
    lines.push('# ctf_local 严格全量验证汇总');
    lines.push('');
    lines.push(`- batch: ${ctx.batch}`);
    lines.push(`- startedAt: ${ctx.startedAt}`);
    lines.push(`- finishedAt: ${ctx.finishedAt}`);
    lines.push(`- port: ${ctx.port}`);
    lines.push(`- timeoutMs: ${ctx.timeoutMs}`);
    lines.push(`- concurrency: ${ctx.concurrency}`);
    lines.push(`- total: ${ctx.total}`);
    lines.push(`- success: ${ctx.success}`);
    lines.push(`- error: ${ctx.error}`);
    lines.push(`- requiredChecks: ${ctx.requiredPassed}/${ctx.requiredTotal}`);
    lines.push('');
    lines.push('| id | name | status | required_pass | required_total | first_play_probe |');
    lines.push('|---|---|---|---:|---:|---|');
    ctx.sources.forEach((s) => {
        lines.push(`| ${s.id} | ${cut(s.name, 48)} | ${s.status} | ${s.requiredPassed} | ${s.requiredTotal} | ${s.stream.primary.ok ? 'ok' : 'fail'} |`);
    });
    lines.push('');
    lines.push('## 严格判定规则');
    lines.push('- 必须通过：home/home(ac=home)/list(pg=1)/list(pg=999)/search正向/search负向/detail正向/detail负向/videolist/play/播放地址探测。');
    lines.push('- 任一必选断言失败即判定为 error。');
    return lines.join('\n');
}

function manualChecklistMd(sources) {
    const lines = [];
    lines.push('# ctf_local 严格测试人工复核清单');
    lines.push('');
    sources.forEach((s, idx) => {
        lines.push(`## ${idx + 1}. ${s.name}`);
        lines.push(`- id: ${s.id}`);
        lines.push(`- status: ${s.status}`);
        lines.push(`- api: ${s.api}`);
        lines.push(`- searchKeyword: ${s.searchKeyword}`);
        lines.push(`- firstPlayableUrl: ${s.firstPlayableUrl || ''}`);
        lines.push('- [ ] 已在客户端导入验证');
        lines.push('- [ ] 首页可打开');
        lines.push('- [ ] 搜索可命中');
        lines.push('- [ ] 分页行为正确');
        lines.push('- [ ] 详情可打开');
        lines.push('- [ ] 播放可起播');
        lines.push('- [ ] 切线可起播');
        lines.push('- 备注:');
        lines.push('');
    });
    return lines.join('\n');
}

function finalReportMd(ctx) {
    const lines = [];
    lines.push(`# CTF 本地源严格测试最终报告（批次 ${ctx.batch}）`);
    lines.push('');
    lines.push('## 结果');
    lines.push(`- total: ${ctx.total}`);
    lines.push(`- success: ${ctx.success}`);
    lines.push(`- error: ${ctx.error}`);
    lines.push(`- requiredChecks: ${ctx.requiredPassed}/${ctx.requiredTotal}`);
    lines.push(`- startedAt: ${ctx.startedAt}`);
    lines.push(`- finishedAt: ${ctx.finishedAt}`);
    lines.push('');
    lines.push('## 产物');
    lines.push(`- summary: reports/ctf-local-adapter-strict-validation/${ctx.batch}/summary.md`);
    lines.push(`- raw: reports/ctf-local-adapter-strict-validation/${ctx.batch}/raw-results.json`);
    lines.push(`- manual: reports/ctf-local-adapter-strict-validation/${ctx.batch}/manual-checklist.md`);
    lines.push('');
    lines.push('## 边界');
    lines.push('- 自动严格测试通过不等于人工终验通过。');
    lines.push('- 人工终验需要逐项勾选 manual-checklist。');
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

function toNum(v, dft = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : dft;
}

function isMediaUrl(url) {
    const u = String(url || '').trim();
    return /^https?:\/\//i.test(u) && (/\.(m3u8|mp4|mpd)(\?|$)/i.test(u) || /manifest\.mpd/i.test(u));
}

function searchKeywordByName(name) {
    const s = String(name || '').trim();
    return s ? s.slice(0, Math.min(4, s.length)) : 'sample';
}

function buildCheck(id, ok, required, message, url, status, durationMs = 0) {
    return {
        id,
        ok: !!ok,
        required: required !== false,
        message: String(message || ''),
        url: String(url || ''),
        status: Number(status || 0),
        durationMs: Number(durationMs || 0),
    };
}

async function callApi(baseApi, args, query = {}) {
    const url = buildApiUrl(baseApi, args.pwd, query);
    const res = await req(url, args.timeoutMs);
    return {url, res, json: res.json || {}};
}

async function testSite(site, args) {
    const checks = [];
    const baseApi = String(site.api || '');

    const homeDefault = await callApi(baseApi, args, {});
    const homeList = Array.isArray(homeDefault.json.list) ? homeDefault.json.list : [];
    const homeVod = homeList[0] || null;
    const homeId = String(homeVod?.vod_id || `${site.id}_1`);
    const homeName = String(homeVod?.vod_name || site.name || site.id);
    const homePlayUrls = parseVodUrls(homeVod);
    checks.push(buildCheck('home.default.code', homeDefault.res.ok && homeDefault.json.code === 1, true, homeDefault.res.error || `code=${homeDefault.json.code}`, homeDefault.url, homeDefault.res.status, homeDefault.res.durationMs));
    checks.push(buildCheck('home.default.class', Array.isArray(homeDefault.json.class) && homeDefault.json.class.length > 0, true, `class_len=${Array.isArray(homeDefault.json.class) ? homeDefault.json.class.length : -1}`, homeDefault.url, homeDefault.res.status, homeDefault.res.durationMs));
    checks.push(buildCheck('home.default.list', homeList.length >= 1, true, `list_len=${homeList.length}`, homeDefault.url, homeDefault.res.status, homeDefault.res.durationMs));
    checks.push(buildCheck('home.default.vod', !!homeId && homePlayUrls.length > 0, true, `vod_id=${homeId},play_lines=${homePlayUrls.length}`, homeDefault.url, homeDefault.res.status, homeDefault.res.durationMs));

    const homeAc = await callApi(baseApi, args, {ac: 'home'});
    const homeAcList = Array.isArray(homeAc.json.list) ? homeAc.json.list : [];
    const homeAcId = String(homeAcList[0]?.vod_id || '');
    checks.push(buildCheck('home.ac.code', homeAc.res.ok && homeAc.json.code === 1, true, homeAc.res.error || `code=${homeAc.json.code}`, homeAc.url, homeAc.res.status, homeAc.res.durationMs));
    checks.push(buildCheck('home.ac.same_id', homeAcId === homeId, true, `default=${homeId},ac=${homeAcId}`, homeAc.url, homeAc.res.status, homeAc.res.durationMs));

    const list1 = await callApi(baseApi, args, {ac: 'list', t: 1, pg: 1, limit: 1});
    const list1Json = list1.json || {};
    const list1Items = Array.isArray(list1Json.list) ? list1Json.list : [];
    const total = toNum(list1Json.total, 0);
    const pagecount = Math.max(1, toNum(list1Json.pagecount, 1));
    checks.push(buildCheck('list.pg1.code', list1.res.ok && list1Json.code === 1, true, list1.res.error || `code=${list1Json.code}`, list1.url, list1.res.status, list1.res.durationMs));
    checks.push(buildCheck('list.pg1.meta', String(list1Json.page) === '1' && String(list1Json.limit) === '1' && total >= 1, true, `page=${list1Json.page},limit=${list1Json.limit},total=${list1Json.total}`, list1.url, list1.res.status, list1.res.durationMs));
    checks.push(buildCheck('list.pg1.size', list1Items.length === 1, true, `len=${list1Items.length}`, list1.url, list1.res.status, list1.res.durationMs));
    checks.push(buildCheck('list.pg1.same_id', String(list1Items[0]?.vod_id || '') === homeId, true, `home=${homeId},list=${list1Items[0]?.vod_id || ''}`, list1.url, list1.res.status, list1.res.durationMs));

    const list999 = await callApi(baseApi, args, {ac: 'list', t: 1, pg: 999, limit: 1});
    const list999Json = list999.json || {};
    const list999Items = Array.isArray(list999Json.list) ? list999Json.list : [];
    checks.push(buildCheck('list.pg999.code', list999.res.ok && list999Json.code === 1, true, list999.res.error || `code=${list999Json.code}`, list999.url, list999.res.status, list999.res.durationMs));
    checks.push(buildCheck('list.pg999.clamp', String(list999Json.page) === String(pagecount) && String(list999Json.pagecount) === String(pagecount), true, `page=${list999Json.page},pagecount=${list999Json.pagecount}`, list999.url, list999.res.status, list999.res.durationMs));
    checks.push(buildCheck('list.pg999.size', total >= 1 ? list999Items.length >= 1 : true, true, `total=${total},len=${list999Items.length}`, list999.url, list999.res.status, list999.res.durationMs));

    const searchKeyword = searchKeywordByName(homeName);
    const searchPos = await callApi(baseApi, args, {ac: 'search', wd: searchKeyword});
    const searchPosJson = searchPos.json || {};
    const searchPosItems = Array.isArray(searchPosJson.list) ? searchPosJson.list : [];
    checks.push(buildCheck('search.pos.code', searchPos.res.ok && searchPosJson.code === 1, true, searchPos.res.error || `code=${searchPosJson.code}`, searchPos.url, searchPos.res.status, searchPos.res.durationMs));
    checks.push(buildCheck('search.pos.hit', searchPosItems.some((x) => String(x?.vod_id || '') === homeId), true, `wd=${searchKeyword},hits=${searchPosItems.length}`, searchPos.url, searchPos.res.status, searchPos.res.durationMs));

    const missWd = `__strict_not_found_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const searchNeg = await callApi(baseApi, args, {ac: 'search', wd: missWd});
    const searchNegJson = searchNeg.json || {};
    const searchNegItems = Array.isArray(searchNegJson.list) ? searchNegJson.list : [];
    checks.push(buildCheck('search.neg.code', searchNeg.res.ok && searchNegJson.code === 1, true, searchNeg.res.error || `code=${searchNegJson.code}`, searchNeg.url, searchNeg.res.status, searchNeg.res.durationMs));
    checks.push(buildCheck('search.neg.empty', searchNegItems.length === 0 && toNum(searchNegJson.total, 0) === 0, true, `total=${searchNegJson.total},len=${searchNegItems.length}`, searchNeg.url, searchNeg.res.status, searchNeg.res.durationMs));

    const detailOk = await callApi(baseApi, args, {ac: 'detail', ids: homeId});
    const detailOkJson = detailOk.json || {};
    const detailOkItems = Array.isArray(detailOkJson.list) ? detailOkJson.list : [];
    checks.push(buildCheck('detail.pos.code', detailOk.res.ok && detailOkJson.code === 1, true, detailOk.res.error || `code=${detailOkJson.code}`, detailOk.url, detailOk.res.status, detailOk.res.durationMs));
    checks.push(buildCheck('detail.pos.hit', detailOkItems.length === 1 && String(detailOkItems[0]?.vod_id || '') === homeId, true, `len=${detailOkItems.length},id=${detailOkItems[0]?.vod_id || ''}`, detailOk.url, detailOk.res.status, detailOk.res.durationMs));

    const detailNeg = await callApi(baseApi, args, {ac: 'detail', ids: `${homeId}_not_exists`});
    const detailNegJson = detailNeg.json || {};
    const detailNegItems = Array.isArray(detailNegJson.list) ? detailNegJson.list : [];
    checks.push(buildCheck('detail.neg.code', detailNeg.res.ok && detailNegJson.code === 1, true, detailNeg.res.error || `code=${detailNegJson.code}`, detailNeg.url, detailNeg.res.status, detailNeg.res.durationMs));
    checks.push(buildCheck('detail.neg.empty', detailNegItems.length === 0 && toNum(detailNegJson.total, 0) === 0, true, `total=${detailNegJson.total},len=${detailNegItems.length}`, detailNeg.url, detailNeg.res.status, detailNeg.res.durationMs));

    const videolist = await callApi(baseApi, args, {ac: 'videolist', ids: homeId});
    const videolistJson = videolist.json || {};
    const videolistItems = Array.isArray(videolistJson.list) ? videolistJson.list : [];
    checks.push(buildCheck('videolist.code', videolist.res.ok && videolistJson.code === 1, true, videolist.res.error || `code=${videolistJson.code}`, videolist.url, videolist.res.status, videolist.res.durationMs));
    checks.push(buildCheck('videolist.hit', videolistItems.length === 1 && String(videolistItems[0]?.vod_id || '') === homeId, true, `len=${videolistItems.length},id=${videolistItems[0]?.vod_id || ''}`, videolist.url, videolist.res.status, videolist.res.durationMs));

    const play = await callApi(baseApi, args, {ac: 'play', id: homeId, play: 1});
    const playJson = play.json || {};
    const playUrl = String(playJson.url || '').trim();
    const detailVod = detailOkItems[0] || homeVod || null;
    const detailPlayUrls = parseVodUrls(detailVod);
    const expectedFirst = detailPlayUrls[0] || homePlayUrls[0] || '';
    checks.push(buildCheck('play.code', play.res.ok && playJson.code === 1, true, play.res.error || `code=${playJson.code}`, play.url, play.res.status, play.res.durationMs));
    checks.push(buildCheck('play.parse_zero', Number(playJson.parse) === 0, true, `parse=${playJson.parse}`, play.url, play.res.status, play.res.durationMs));
    checks.push(buildCheck('play.url.nonempty', !!playUrl, true, `url=${cut(playUrl, 120)}`, play.url, play.res.status, play.res.durationMs));
    checks.push(buildCheck('play.url.expected_first', !!expectedFirst && playUrl === expectedFirst, true, `expected=${cut(expectedFirst, 120)} actual=${cut(playUrl, 120)}`, play.url, play.res.status, play.res.durationMs));
    checks.push(buildCheck('play.url.media', isMediaUrl(playUrl), true, `url=${cut(playUrl, 120)}`, play.url, play.res.status, play.res.durationMs));

    const probeCandidates = Array.from(new Set([playUrl, ...detailPlayUrls, ...homePlayUrls].filter(Boolean))).slice(0, 3);
    const probes = [];
    for (const one of probeCandidates) {
        const pr = await probePlayable(one, Math.min(args.timeoutMs, 16_000));
        probes.push({url: one, ok: !!pr.ok, reason: pr.reason || '', status: pr.status || -1});
    }
    const primaryProbe = probes[0] || {url: '', ok: false, reason: 'no_candidate', status: -1};
    checks.push(buildCheck('play.url.probe', primaryProbe.ok === true, true, primaryProbe.reason, primaryProbe.url, primaryProbe.status));
    if (probes.length > 1) {
        const alt = probes[1];
        checks.push(buildCheck('play.alt.probe', alt.ok === true, false, alt.reason, alt.url, alt.status));
    }

    const evaluated = evaluateSite({checks});
    return {
        id: site.id,
        key: site.key || site.id,
        name: site.name || site.id,
        api: baseApi,
        status: evaluated.status,
        requiredTotal: evaluated.requiredTotal,
        requiredPassed: evaluated.requiredPassed,
        requiredFailed: evaluated.requiredFailed,
        searchKeyword,
        firstPlayableUrl: playUrl || expectedFirst,
        stream: {primary: primaryProbe, probes},
        checks,
    };
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const startedAt = nowIso();
    const batch = fmt();
    const reportDir = path.join(ROOT, 'reports', 'ctf-local-adapter-strict-validation', batch);
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

        const normalized = await runPool(sites, async (site) => testSite(site, args), args.concurrency);

        let success = 0;
        let error = 0;
        let requiredTotal = 0;
        let requiredPassed = 0;
        normalized.forEach((x) => {
            if (x.status === 'success') success += 1;
            else error += 1;
            requiredTotal += Number(x.requiredTotal || 0);
            requiredPassed += Number(x.requiredPassed || 0);
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
                mode: 'strict',
            },
            summary: {
                total: normalized.length,
                success,
                error,
                requiredTotal,
                requiredPassed,
                requiredFailed: requiredTotal - requiredPassed,
            },
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
            timeoutMs: args.timeoutMs,
            concurrency: args.concurrency,
            total: normalized.length,
            success,
            error,
            requiredTotal,
            requiredPassed,
            sources: normalized,
        }), 'utf8');
        await fsp.writeFile(path.join(reportDir, 'manual-checklist.md'), manualChecklistMd(normalized), 'utf8');
        await fsp.writeFile(path.join(reportDir, 'final-execution-report.md'), finalReportMd({
            batch,
            startedAt,
            finishedAt,
            total: normalized.length,
            success,
            error,
            requiredTotal,
            requiredPassed,
        }), 'utf8');

        console.log(`[ctf-local-adapter-strict-validation] reportDir=${reportDir}`);
        console.log(`[ctf-local-adapter-strict-validation] total=${normalized.length}, success=${success}, error=${error}, requiredPassed=${requiredPassed}/${requiredTotal}`);
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
    console.error('[ctf-local-adapter-strict-validation] failed:', e);
    process.exit(1);
});
