import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import net from 'net';
import {spawn} from 'child_process';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const MAIN_PORT = 5757;
const BASE = `http://127.0.0.1:${MAIN_PORT}`;
const DEFAULT_CONFIG_URL = `${BASE}/config/1?sub=all&healthy=0&pwd=`;
const DEFAULT_CONCURRENCY = Number(process.env.SOURCE_CHECK_CONCURRENCY || 12);
const DEFAULT_TIMEOUT_MS = Number(process.env.SOURCE_CHECK_TIMEOUT_MS || 15000);
const DEFAULT_MODE = process.env.SOURCE_CHECK_MODE || 'full';

const nowIso = () => new Date().toISOString();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cut = (s, n = 240) => (s === undefined || s === null ? '' : String(s).replace(/\r?\n/g, ' ').slice(0, n));
const fmt = (d = new Date()) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;

function parseArgs(argv) {
    const out = {
        concurrency: DEFAULT_CONCURRENCY,
        timeoutMs: DEFAULT_TIMEOUT_MS,
        mode: DEFAULT_MODE,
        configUrl: DEFAULT_CONFIG_URL,
    };
    for (const a of argv) {
        if (a.startsWith('--concurrency=')) out.concurrency = Number(a.split('=').slice(1).join('=')) || out.concurrency;
        else if (a.startsWith('--timeout=')) out.timeoutMs = Number(a.split('=').slice(1).join('=')) || out.timeoutMs;
        else if (a.startsWith('--mode=')) out.mode = a.split('=').slice(1).join('=').trim() || out.mode;
        else if (a.startsWith('--config=')) out.configUrl = a.split('=').slice(1).join('=').trim() || out.configUrl;
    }
    out.mode = out.mode === 'quick' ? 'quick' : 'full';
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

async function waitHttp(url, timeoutMs = 60000) {
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

async function req(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const c = new AbortController();
    const t0 = Date.now();
    const timer = setTimeout(() => c.abort(), timeoutMs);
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
            text,
            json,
            durationMs: Date.now() - t0,
        };
    } catch (e) {
        return {
            ok: false,
            status: -1,
            text: '',
            json: null,
            durationMs: Date.now() - t0,
            error: e.message || String(e),
        };
    } finally {
        clearTimeout(timer);
    }
}

function getExtendParam(ext) {
    if (ext === undefined || ext === null || ext === '') return '';
    if (typeof ext === 'string') return ext;
    try {
        return JSON.stringify(ext);
    } catch {
        return String(ext);
    }
}

function isValidData(data) {
    if (!data || typeof data !== 'object') return false;
    if (Array.isArray(data.list)) {
        const valid = data.list.filter((it) => it && it.vod_id && it.vod_id !== 'no_data');
        if (valid.length > 0) return true;
    }
    if (Array.isArray(data.class) && data.class.length > 0) return true;
    return false;
}

function apiWithParams(baseUrl, params = {}) {
    const u = new URL(baseUrl);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v));
    });
    return u.toString();
}

async function testJsonApi(baseUrl, params, timeoutMs) {
    const url = apiWithParams(baseUrl, params);
    const r = await req(url, timeoutMs);
    if (r.error) return {success: false, url, status: r.status, error: `request error: ${r.error}`, durationMs: r.durationMs};
    if (!r.ok) return {success: false, url, status: r.status, error: `HTTP ${r.status}`, durationMs: r.durationMs, bodySample: cut(r.text, 180)};
    if (!r.json) return {success: false, url, status: r.status, error: 'response is not JSON', durationMs: r.durationMs, bodySample: cut(r.text, 180)};
    if (r.json.error) return {success: false, url, status: r.status, error: cut(r.json.error, 160), durationMs: r.durationMs, data: r.json};
    return {success: true, url, status: r.status, durationMs: r.durationMs, data: r.json};
}

function looksLikeUrl(x) {
    if (typeof x !== 'string') return false;
    const s = x.trim();
    return /^https?:\/\//i.test(s) || s.startsWith('/') || s.startsWith('./') || s.startsWith('../');
}

function resolveUrlMaybe(value, baseUrl, fallbackOrigin) {
    if (typeof value !== 'string') return null;
    const s = value.trim();
    if (!s) return null;
    if (/^https?:\/\//i.test(s)) return s;
    if (s.startsWith('assets://')) return s;
    if (s.startsWith('/')) return `${fallbackOrigin}${s}`;
    if (s.startsWith('./') || s.startsWith('../')) {
        try {
            return new URL(s, baseUrl).toString();
        } catch {
            return null;
        }
    }
    return null;
}

function extractHttpUrlsFromText(text) {
    if (typeof text !== 'string') return [];
    const out = [];
    const re = /https?:\/\/[^\s,;"'<>]+/ig;
    let m;
    while ((m = re.exec(text)) !== null) {
        const u = String(m[0] || '').trim();
        if (u) out.push(u);
    }
    return out;
}

function collectCandidateStrings(value, out = []) {
    if (value === undefined || value === null) return out;
    if (typeof value === 'string') {
        const v = value.trim();
        if (v) out.push(v);
        return out;
    }
    if (Array.isArray(value)) {
        value.forEach((it) => collectCandidateStrings(it, out));
        return out;
    }
    if (typeof value === 'object') {
        Object.values(value).forEach((it) => collectCandidateStrings(it, out));
    }
    return out;
}

function uniqStrings(arr) {
    return Array.from(new Set((arr || []).filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim())));
}

function getExtHttpCandidates(extValue, baseUrl, fallbackOrigin) {
    const strings = collectCandidateStrings(extValue, []);
    const urls = [];
    for (const s of strings) {
        extractHttpUrlsFromText(s).forEach((u) => urls.push(u));
        if (looksLikeUrl(s)) {
            const u = resolveUrlMaybe(s, baseUrl, fallbackOrigin);
            if (u && /^https?:\/\//i.test(u)) urls.push(u);
        }
    }
    return uniqStrings(urls);
}

async function checkResource(url, timeoutMs) {
    const r = await req(url, timeoutMs);
    if (r.error) {
        return {success: false, url, status: r.status, error: r.error, durationMs: r.durationMs};
    }
    const ok = r.status >= 200 && r.status < 400 && (r.text.length > 0 || r.json !== null);
    return {
        success: ok,
        url,
        status: r.status,
        durationMs: r.durationMs,
        bodySample: cut(r.text, 140),
        error: ok ? '' : `HTTP ${r.status}`,
    };
}

async function checkType4(source, mode, timeoutMs) {
    const extend = getExtendParam(source.ext);
    const details = {};
    const testUrls = {};

    const home = await testJsonApi(source.api, {extend}, timeoutMs);
    details.home = home;
    testUrls.home = home.url;
    const homeValid = home.success && isValidData(home.data);
    const firstClassId = home.data?.class?.[0]?.type_id || '1';

    const category = await testJsonApi(source.api, {ac: 'list', t: firstClassId, pg: 1, extend}, timeoutMs);
    details.category = category;
    testUrls.category = category.url;
    const categoryValid = category.success && isValidData(category.data);

    const coreSuccess = (homeValid ? 1 : 0) + (categoryValid ? 1 : 0);
    if (mode === 'quick') {
        if (coreSuccess > 0) {
            return {
                status: 'success',
                message: homeValid ? '推荐接口正常' : '分类接口正常',
                details,
                testUrls,
            };
        }
        return {
            status: 'error',
            message: '推荐和分类接口均异常',
            details,
            testUrls,
        };
    }

    const detailId = home.data?.list?.[0]?.vod_id || category.data?.list?.[0]?.vod_id || '1';
    const search = await testJsonApi(source.api, {ac: 'list', wd: '测试', extend}, timeoutMs);
    details.search = search;
    testUrls.search = search.url;

    const detail = await testJsonApi(source.api, {ac: 'detail', ids: detailId, extend}, timeoutMs);
    details.detail = detail;
    testUrls.detail = detail.url;

    const play = await testJsonApi(source.api, {ac: 'play', id: detailId, play: '1', extend}, timeoutMs);
    details.play = play;
    testUrls.play = play.url;

    const totalSuccess = coreSuccess + (search.success ? 1 : 0) + (detail.success ? 1 : 0);
    if (coreSuccess === 0) {
        return {
            status: 'error',
            message: '推荐和分类接口均异常',
            details,
            testUrls,
        };
    }
    if (totalSuccess >= 2) {
        return {
            status: 'success',
            message: `${totalSuccess}/4 接口正常（play为附加探针）`,
            details,
            testUrls,
        };
    }
    return {
        status: 'error',
        message: `仅 ${totalSuccess}/4 接口正常`,
        details,
        testUrls,
    };
}

async function checkType3(source, timeoutMs, fallbackOrigin) {
    const details = {};
    const testUrls = {};
    const apiUrl = resolveUrlMaybe(source.api, source.api, fallbackOrigin);
    const extRaw = getExtendParam(source.ext);
    const extCandidates = getExtHttpCandidates(source.ext, source.api, fallbackOrigin).slice(0, 5);

    const checkExtCandidates = async () => {
        if (extCandidates.length === 0) return {anySuccess: false, total: 0};
        const extChecks = [];
        for (const u of extCandidates) {
            const one = await checkResource(u, timeoutMs);
            extChecks.push(one);
        }
        details.extCandidates = extChecks;
        testUrls.extCandidates = extCandidates;
        return {anySuccess: extChecks.some((x) => x.success), total: extChecks.length};
    };

    if (typeof source.api === 'string' && source.api.startsWith('assets://')) {
        return {
            status: 'pending',
            message: 'assets api requires client runtime',
            details: {
                api: {success: false, url: source.api, error: 'unsupported scheme assets://'},
            },
            testUrls: {api: source.api},
        };
    }

    if (!apiUrl || !/^https?:\/\//i.test(apiUrl)) {
        const extProbe = await checkExtCandidates();
        if (extProbe.total > 0) {
            if (extProbe.anySuccess) {
                return {
                    status: 'success',
                    message: `non-http api but ext resources reachable (${extProbe.total})`,
                    details: {
                        api: {success: false, url: source.api, error: 'non-http api'},
                        ...details,
                    },
                    testUrls: {api: source.api || '', ...testUrls},
                };
            }
            return {
                status: 'pending',
                message: `non-http api ext resources unreachable (${extProbe.total}), client validation required`,
                details: {
                    api: {success: false, url: source.api, error: 'non-http api'},
                    ...details,
                },
                testUrls: {api: source.api || '', ...testUrls},
            };
        }
        return {
            status: 'pending',
            message: 'non-http api requires client-side validation',
            details: {api: {success: false, url: source.api, error: 'non-http api'}},
            testUrls: {api: source.api || ''},
        };
    }

    const apiCheck = await checkResource(apiUrl, timeoutMs);
    details.api = apiCheck;
    testUrls.api = apiUrl;

    if (extCandidates.length > 0) {
        const extProbe = await checkExtCandidates();
        if (!apiCheck.success || !extProbe.anySuccess) {
            return {
                status: 'error',
                message: `resource check failed: api=${apiCheck.success} extAny=${extProbe.anySuccess}`,
                details,
                testUrls,
            };
        }
        return {
            status: 'success',
            message: `api/ext resources reachable (${extProbe.total})`,
            details,
            testUrls,
        };
    }

    if (extRaw) {
        if (apiCheck.success) {
            return {
                status: 'pending',
                message: 'api reachable but ext is non-http or opaque',
                details,
                testUrls,
            };
        }
        return {
            status: 'error',
            message: 'api unreachable and ext not auto-testable',
            details,
            testUrls,
        };
    }

    return {
        status: apiCheck.success ? 'success' : 'error',
        message: apiCheck.success ? 'api resource reachable' : 'api resource unreachable',
        details,
        testUrls,
    };
}

async function runPool(items, worker, concurrency) {
    const results = new Array(items.length);
    let cursor = 0;
    let completed = 0;

    async function runner() {
        while (true) {
            const i = cursor++;
            if (i >= items.length) return;
            try {
                results[i] = await worker(items[i], i);
            } catch (e) {
                results[i] = {status: 'error', message: `worker error: ${e.message}`, details: {}};
            }
            completed += 1;
            if (completed % 10 === 0 || completed === items.length) {
                console.log(`[source-checker] progress ${completed}/${items.length}`);
            }
        }
    }

    const workers = Array.from({length: Math.min(concurrency, items.length)}, () => runner());
    await Promise.all(workers);
    return results;
}

function buildSummaryMd(report, ctx) {
    const lines = [];
    lines.push('# 全量源并发检测汇总报告');
    lines.push('');
    lines.push(`- 时间: ${ctx.startedAt} ~ ${ctx.finishedAt}`);
    lines.push(`- 配置地址: ${report.configUrl}`);
    lines.push(`- 模式: ${ctx.mode}`);
    lines.push(`- 并发数: ${ctx.concurrency}`);
    lines.push(`- 超时(ms): ${ctx.timeoutMs}`);
    lines.push(`- 总数: ${report.totalSources}`);
    lines.push(`- 成功: ${report.summary.success}`);
    lines.push(`- 失败: ${report.summary.error}`);
    lines.push(`- 待人工: ${report.summary.pending}`);
    lines.push(`- 服务由脚本启动: ${ctx.startedHere}`);
    lines.push('');
    lines.push('## 按类型统计');
    Object.entries(ctx.byType).sort((a, b) => a[0].localeCompare(b[0])).forEach(([k, v]) => lines.push(`- type=${k}: ${v}`));
    lines.push('');
    lines.push('## 按语言统计');
    Object.entries(ctx.byLang).sort((a, b) => a[0].localeCompare(b[0])).forEach(([k, v]) => lines.push(`- lang=${k}: ${v}`));
    lines.push('');
    lines.push('## 结果分布');
    lines.push(`- success: ${report.summary.success}`);
    lines.push(`- error: ${report.summary.error}`);
    lines.push(`- pending: ${report.summary.pending}`);
    lines.push('');
    lines.push('## 说明');
    lines.push('- type=4 使用接口链路探测（home/category/search/detail，附加play探针）。');
    lines.push('- type=3 使用资源可加载性探测（api/ext）。');
    lines.push('- assets:// 与对象型 ext 无法纯服务端自动执行，标记为 pending 并进入人工校验清单。');
    return lines.join('\n');
}

function buildManualChecklist(report) {
    const lines = [];
    lines.push('# 人工校验清单');
    lines.push('');
    const targets = report.sources.filter((s) => s.status !== 'success');
    lines.push(`- 需人工校验数量: ${targets.length}`);
    lines.push('');
    targets.forEach((s, i) => {
        lines.push(`## ${i + 1}. ${s.name}`);
        lines.push(`- key: ${s.key}`);
        lines.push(`- status: ${s.status}`);
        lines.push(`- message: ${s.message}`);
        lines.push(`- type/lang: ${s.type}/${s.lang}`);
        if (s.testUrls?.home) lines.push(`- home: ${s.testUrls.home}`);
        if (s.testUrls?.category) lines.push(`- category: ${s.testUrls.category}`);
        if (s.testUrls?.search) lines.push(`- search: ${s.testUrls.search}`);
        if (s.testUrls?.detail) lines.push(`- detail: ${s.testUrls.detail}`);
        if (s.testUrls?.play) lines.push(`- play: ${s.testUrls.play}`);
        if (s.testUrls?.api) lines.push(`- api: ${s.testUrls.api}`);
        if (s.testUrls?.ext) lines.push(`- ext: ${s.testUrls.ext}`);
        lines.push('- 人工结论: [ ] 通过  [ ] 失败');
        lines.push('- 备注:');
        lines.push('');
    });
    return lines.join('\n');
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const startedAt = nowIso();
    const batch = fmt();
    const reportDir = path.join(ROOT, 'reports', 'source-checker-batch', batch);
    await fsp.mkdir(reportDir, {recursive: true});

    const stdoutLog = path.join(reportDir, 'server.stdout.log');
    const stderrLog = path.join(reportDir, 'server.stderr.log');
    const out = fs.createWriteStream(stdoutLog, {flags: 'a'});
    const err = fs.createWriteStream(stderrLog, {flags: 'a'});

    let startedHere = false;
    let srv = null;
    let config = null;
    const healthUrl = `${BASE}/health`;

    try {
        const online = await tcpOpen('127.0.0.1', MAIN_PORT);
        if (!online) {
            const env = {...process.env};
            delete env.API_AUTH_NAME;
            delete env.API_AUTH_CODE;
            delete env.API_PWD;
            if (!env.PROXY_AUTH) env.PROXY_AUTH = 'drpys';
            srv = spawn(process.execPath, ['index.js'], {cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe']});
            srv.stdout.pipe(out);
            srv.stderr.pipe(err);
            startedHere = true;
            const ready = await waitHttp(healthUrl, 90000);
            if (!ready) throw new Error('服务启动后未就绪');
            await sleep(1000);
        }

        const cfgRes = await req(args.configUrl, args.timeoutMs);
        if (!cfgRes.ok || !cfgRes.json || !Array.isArray(cfgRes.json.sites)) {
            throw new Error(`读取配置失败: HTTP ${cfgRes.status}, sample=${cut(cfgRes.text, 220)}`);
        }
        config = cfgRes.json;
        const sites = config.sites;
        const baseOrigin = new URL(args.configUrl).origin;

        const byType = {};
        const byLang = {};
        for (const s of sites) {
            const t = String(s.type ?? 'unknown');
            const l = String(s.lang ?? 'unknown');
            byType[t] = (byType[t] || 0) + 1;
            byLang[l] = (byLang[l] || 0) + 1;
        }

        console.log(`[source-checker] total sites=${sites.length}, mode=${args.mode}, concurrency=${args.concurrency}`);

        const checks = await runPool(
            sites,
            async (source) => {
                const t0 = Date.now();
                const sourceType = Number(source.type);
                let checked;
                if (sourceType === 4) {
                    checked = await checkType4(source, args.mode, args.timeoutMs);
                } else {
                    checked = await checkType3(source, args.timeoutMs, baseOrigin);
                }
                return {
                    key: source.key,
                    name: source.name || source.key,
                    api: source.api,
                    type: source.type,
                    searchable: source.searchable,
                    lang: source.lang || 'unknown',
                    status: checked.status,
                    message: checked.message,
                    testUrls: checked.testUrls || {},
                    details: checked.details || {},
                    checkTime: nowIso(),
                    manuallyMarked: false,
                    durationMs: Date.now() - t0,
                };
            },
            args.concurrency
        );

        const report = {
            exportTime: nowIso(),
            configUrl: args.configUrl,
            totalSources: checks.length,
            summary: {success: 0, error: 0, pending: 0},
            sources: checks,
            meta: {
                mode: args.mode,
                concurrency: args.concurrency,
                timeoutMs: args.timeoutMs,
                startedAt,
                finishedAt: nowIso(),
                startedHere,
                batch,
            },
        };

        checks.forEach((s) => {
            if (s.status === 'success') report.summary.success += 1;
            else if (s.status === 'pending') report.summary.pending += 1;
            else report.summary.error += 1;
        });

        report.sources.sort((a, b) => {
            const ord = {success: 0, error: 1, pending: 2};
            return (ord[a.status] ?? 9) - (ord[b.status] ?? 9);
        });

        const finishedAt = report.meta.finishedAt;
        await fsp.writeFile(path.join(reportDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
        await fsp.writeFile(path.join(reportDir, 'summary.md'), buildSummaryMd(report, {
            startedAt,
            finishedAt,
            mode: args.mode,
            concurrency: args.concurrency,
            timeoutMs: args.timeoutMs,
            startedHere,
            byType,
            byLang,
        }), 'utf8');
        await fsp.writeFile(path.join(reportDir, 'manual-checklist.md'), buildManualChecklist(report), 'utf8');
        await fsp.writeFile(path.join(reportDir, 'sites.json'), JSON.stringify(config.sites, null, 2), 'utf8');

        const dataDir = path.join(ROOT, 'data', 'source-checker');
        await fsp.mkdir(dataDir, {recursive: true});
        await fsp.writeFile(path.join(dataDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');

        console.log(`[source-checker] reportDir=${reportDir}`);
        console.log(`[source-checker] success=${report.summary.success}, error=${report.summary.error}, pending=${report.summary.pending}, total=${report.totalSources}`);
    } finally {
        try {
            out.end();
        } catch {
        }
        try {
            err.end();
        } catch {
        }
        if (srv && srv.exitCode === null) {
            srv.kill('SIGINT');
            await sleep(1500);
            if (srv.exitCode === null) srv.kill('SIGTERM');
            await sleep(800);
            if (srv.exitCode === null) srv.kill('SIGKILL');
        }
    }
}

main().catch((e) => {
    console.error('[full-source-checker] failed:', e);
    process.exit(1);
});
