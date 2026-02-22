import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import net from 'net';
import {spawn} from 'child_process';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const DEFAULT_PORT = Number(process.env.MANUAL_RECHECK_PORT || 5757);
const DEFAULT_TIMEOUT_MS = Number(process.env.MANUAL_RECHECK_TIMEOUT_MS || 30000);
const DEFAULT_PWD = process.env.API_PWD || '';

const CASES = [
    {
        key: 'hipy_py_五八[AG¹]',
        name: '五八[AG¹](hipy)',
        module: 'AppGet',
        do: 'py',
        extend: {host: 'https://dy.58ys.vip', key: 'JEWibY1AgWF0V1xx'},
    },
    {
        key: 'hipy_py_紫云[AV¹]',
        name: '紫云[AV¹](hipy)',
        module: 'AppV1',
        do: 'py',
        extend: 'http://ziyuncms.feifan12.xyz/api.php',
    },
];

const nowIso = () => new Date().toISOString();
const fmt = (d = new Date()) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
const cut = (s, n = 240) => (s === undefined || s === null ? '' : String(s).replace(/\r?\n/g, ' ').slice(0, n));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const safeName = (x) => String(x || '').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'source';

function parseArgs(argv) {
    const out = {port: DEFAULT_PORT, timeoutMs: DEFAULT_TIMEOUT_MS, pwd: DEFAULT_PWD};
    for (const a of argv) {
        if (a.startsWith('--port=')) out.port = Number(a.split('=').slice(1).join('=')) || out.port;
        else if (a.startsWith('--timeout=')) out.timeoutMs = Number(a.split('=').slice(1).join('=')) || out.timeoutMs;
        else if (a.startsWith('--pwd=')) out.pwd = a.split('=').slice(1).join('=');
    }
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

async function waitPort(host, port, timeoutMs = 90_000) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
        const ok = await tcpOpen(host, port, 1200);
        if (ok) return true;
        await sleep(500);
    }
    return false;
}

async function waitHttp(url, timeoutMs = 90_000) {
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

async function req(url, timeoutMs) {
    const c = new AbortController();
    const timer = setTimeout(() => c.abort(), timeoutMs);
    const t0 = Date.now();
    try {
        const res = await fetch(url, {signal: c.signal});
        const text = await res.text();
        let json = null;
        try {
            json = JSON.parse(text);
        } catch {
        }
        return {
            ok: res.ok,
            status: res.status,
            durationMs: Date.now() - t0,
            text,
            json,
            error: '',
        };
    } catch (e) {
        return {
            ok: false,
            status: -1,
            durationMs: Date.now() - t0,
            text: '',
            json: null,
            error: e.message || String(e),
        };
    } finally {
        clearTimeout(timer);
    }
}

function buildApi(base, caze, pwd, query = {}) {
    const u = new URL(`${base}/api/${caze.module}`);
    u.searchParams.set('do', caze.do);
    const extValue = typeof caze.extend === 'string' ? caze.extend : JSON.stringify(caze.extend);
    u.searchParams.set('extend', extValue);
    if (pwd) u.searchParams.set('pwd', pwd);
    Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
            u.searchParams.set(k, String(v));
        }
    });
    return u.toString();
}

function parseFirstPlay(vod) {
    const from = String(vod?.vod_play_from || '').split('$$$')[0] || '';
    const block = String(vod?.vod_play_url || '').split('$$$')[0] || '';
    const row = block.split('#')[0] || '';
    const id = row.split('$').slice(1).join('$');
    return {flag: from, playId: id};
}

function probePlayableUrl(url) {
    const u = String(url || '').trim();
    if (!u) return false;
    if (!/^https?:\/\//i.test(u)) return false;
    return true;
}

async function runOne(base, caze, args) {
    const steps = [];
    const push = (name, ok, url, status, msg, durationMs = 0) => steps.push({name, ok, url, status, message: cut(msg, 220), durationMs});

    const homeUrl = buildApi(base, caze, args.pwd, {});
    const home = await req(homeUrl, args.timeoutMs);
    const homeJson = home.json || {};
    const homeList = Array.isArray(homeJson.list) ? homeJson.list : [];
    const homeClass = Array.isArray(homeJson.class) ? homeJson.class : [];
    const homeOk = home.ok && homeJson && (homeClass.length > 0 || homeList.length > 0);
    push('home', homeOk, homeUrl, home.status, home.error || `class=${homeClass.length},list=${homeList.length}`, home.durationMs);

    const tid = String(homeClass[0]?.type_id || '1');
    const listUrl = buildApi(base, caze, args.pwd, {ac: 'list', t: tid, pg: 1});
    const list = await req(listUrl, args.timeoutMs);
    const listJson = list.json || {};
    const listItems = Array.isArray(listJson.list) ? listJson.list : [];
    const listOk = list.ok && listJson && Array.isArray(listJson.list);
    push('list', listOk, listUrl, list.status, list.error || `items=${listItems.length}`, list.durationMs);

    const nameSeed = String(listItems[0]?.vod_name || homeList[0]?.vod_name || caze.name || '').trim();
    const wd = nameSeed ? nameSeed.slice(0, Math.min(4, nameSeed.length)) : '测试';
    const searchUrl = buildApi(base, caze, args.pwd, {wd, pg: 1});
    const search = await req(searchUrl, args.timeoutMs);
    const searchJson = search.json || {};
    const searchItems = Array.isArray(searchJson.list) ? searchJson.list : [];
    const searchOk = search.ok && searchJson && Array.isArray(searchJson.list);
    push('search', searchOk, searchUrl, search.status, search.error || `wd=${wd},items=${searchItems.length}`, search.durationMs);

    const detailId = String(listItems[0]?.vod_id || homeList[0]?.vod_id || searchItems[0]?.vod_id || '1');
    const detailUrl = buildApi(base, caze, args.pwd, {ac: 'detail', ids: detailId});
    const detail = await req(detailUrl, args.timeoutMs);
    const detailJson = detail.json || {};
    const detailItems = Array.isArray(detailJson.list) ? detailJson.list : [];
    const detailOk = detail.ok && detailJson && Array.isArray(detailJson.list) && detailItems.length > 0;
    push('detail', detailOk, detailUrl, detail.status, detail.error || `items=${detailItems.length}`, detail.durationMs);

    const firstVod = detailItems[0] || listItems[0] || homeList[0] || null;
    const pp = parseFirstPlay(firstVod);
    const playUrl = buildApi(base, caze, args.pwd, {play: pp.playId, flag: pp.flag});
    const play = await req(playUrl, args.timeoutMs);
    const playJson = play.json || {};
    const playRetUrl = String(playJson.url || '').trim();
    const playOk = play.ok && playJson && (playRetUrl.length > 0 || Number(playJson.parse) === 1);
    push('play', playOk, playUrl, play.status, play.error || `parse=${playJson.parse},url=${cut(playRetUrl, 100)}`, play.durationMs);

    const chainProbeOk = probePlayableUrl(playRetUrl) || Number(playJson.parse) === 1;
    push('play_probe', chainProbeOk, playRetUrl, 200, chainProbeOk ? 'ok' : 'invalid_play_url', 0);

    const fail = steps.filter((x) => !x.ok);
    return {
        key: caze.key,
        name: caze.name,
        module: caze.module,
        ext: caze.extend,
        status: fail.length === 0 ? 'pass' : 'fail',
        failed: fail.length,
        steps,
    };
}

function sourceMd(s) {
    const lines = [];
    lines.push(`# 人工复验报告 - ${s.name}`);
    lines.push('');
    lines.push(`- key: ${s.key}`);
    lines.push(`- module: ${s.module}`);
    lines.push(`- status: ${s.status}`);
    lines.push(`- failed: ${s.failed}`);
    lines.push('');
    lines.push('## 步骤结果');
    s.steps.forEach((x) => {
        lines.push(`- ${x.name}: ${x.ok ? 'PASS' : 'FAIL'} | status=${x.status} | ${x.message} | ${x.url}`);
    });
    lines.push('');
    lines.push('## 人工结论');
    lines.push('- [ ] 保留');
    lines.push('- [ ] 删除');
    lines.push('- 备注:');
    return lines.join('\n');
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const batch = fmt();
    const outDir = path.join(ROOT, 'reports', 'manual-recheck', batch);
    await fsp.mkdir(outDir, {recursive: true});

    const base = `http://127.0.0.1:${args.port}`;
    const serviceOpen = await tcpOpen('127.0.0.1', args.port, 1500);
    let child = null;
    if (!serviceOpen) {
        child = spawn(process.execPath, ['index.js'], {
            cwd: ROOT,
            env: {...process.env, PORT: String(args.port), API_PWD: args.pwd || process.env.API_PWD || ''},
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        const out = fs.createWriteStream(path.join(outDir, 'runtime.stdout.log'), {encoding: 'utf8'});
        const err = fs.createWriteStream(path.join(outDir, 'runtime.stderr.log'), {encoding: 'utf8'});
        child.stdout?.pipe(out);
        child.stderr?.pipe(err);
        const ok = await waitHttp(`${base}/health`, 90_000);
        if (!ok) throw new Error('drpy-node startup timeout');
    }

    // hipy py 引擎依赖 python daemon(57570)，未就绪会产生 500 误判
    const daemonOk = await waitPort('127.0.0.1', 57570, 90_000);
    if (!daemonOk) {
        throw new Error('python daemon(57570) not ready, skip manual recheck to avoid false-negative');
    }

    try {
        const startedAt = nowIso();
        const sources = [];
        for (const caze of CASES) {
            const one = await runOne(base, caze, args);
            sources.push(one);
            await fsp.writeFile(path.join(outDir, `source-${safeName(caze.key)}.md`), sourceMd(one), 'utf8');
        }
        const pass = sources.filter((x) => x.status === 'pass').length;
        const fail = sources.length - pass;
        const payload = {
            meta: {batch, startedAt, finishedAt: nowIso(), port: args.port, timeoutMs: args.timeoutMs},
            summary: {total: sources.length, pass, fail},
            sources,
        };
        await fsp.writeFile(path.join(outDir, 'raw-results.json'), JSON.stringify(payload, null, 2), 'utf8');

        const lines = [];
        lines.push('# 人工复验汇总');
        lines.push('');
        lines.push(`- batch: ${batch}`);
        lines.push(`- total: ${sources.length}`);
        lines.push(`- pass: ${pass}`);
        lines.push(`- fail: ${fail}`);
        lines.push('');
        sources.forEach((s) => {
            lines.push(`- ${s.key}: ${s.status} (${s.failed} failed steps)`);
        });
        await fsp.writeFile(path.join(outDir, 'summary.md'), lines.join('\n'), 'utf8');
        console.log(`[manual-recheck] reportDir=${outDir}`);
        console.log(`[manual-recheck] total=${sources.length}, pass=${pass}, fail=${fail}`);
    } finally {
        if (child) {
            child.kill('SIGTERM');
            await sleep(1000);
            if (!child.killed) child.kill('SIGKILL');
        }
    }
}

main().catch((e) => {
    console.error('[manual-recheck] failed:', e);
    process.exit(1);
});
