import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const DEFAULT_TIMEOUT_MS = Number(process.env.SOURCE_PRUNE_TIMEOUT_MS || 15000);
const DEFAULT_RETRIES = Number(process.env.SOURCE_PRUNE_RETRIES || 2);
const DEFAULT_CONCURRENCY = Number(process.env.SOURCE_PRUNE_CONCURRENCY || 10);
const DEFAULT_APPLY = (process.env.SOURCE_PRUNE_APPLY || '0') === '1';

const nowIso = () => new Date().toISOString();
const fmt = (d = new Date()) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
const cut = (s, n = 180) => (s === undefined || s === null ? '' : String(s).replace(/\r?\n/g, ' ').slice(0, n));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseArgs(argv) {
    const out = {
        reportPath: '',
        timeoutMs: DEFAULT_TIMEOUT_MS,
        retries: DEFAULT_RETRIES,
        concurrency: DEFAULT_CONCURRENCY,
        apply: DEFAULT_APPLY,
        disableFile: path.join(ROOT, 'data', 'source-checker', 'disabled-sources.json'),
    };
    for (const a of argv) {
        if (a.startsWith('--report=')) out.reportPath = a.split('=').slice(1).join('=').trim();
        else if (a.startsWith('--timeout=')) out.timeoutMs = Number(a.split('=').slice(1).join('=')) || out.timeoutMs;
        else if (a.startsWith('--retries=')) out.retries = Number(a.split('=').slice(1).join('=')) || out.retries;
        else if (a.startsWith('--concurrency=')) out.concurrency = Number(a.split('=').slice(1).join('=')) || out.concurrency;
        else if (a.startsWith('--apply=')) out.apply = a.split('=').slice(1).join('=').trim() === '1';
        else if (a.startsWith('--disable-file=')) out.disableFile = a.split('=').slice(1).join('=').trim();
    }
    if (out.retries < 1) out.retries = 1;
    if (out.concurrency < 1) out.concurrency = 1;
    return out;
}

function findLatestReportPath() {
    const dir = path.join(ROOT, 'reports', 'source-checker-batch');
    if (!fs.existsSync(dir)) return '';
    const dirs = fs.readdirSync(dir, {withFileTypes: true})
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
        .reverse();
    for (const one of dirs) {
        const p = path.join(dir, one, 'report.json');
        if (fs.existsSync(p)) return p;
    }
    return '';
}

async function req(url, timeoutMs) {
    const c = new AbortController();
    const timer = setTimeout(() => c.abort(), timeoutMs);
    const t0 = Date.now();
    try {
        const res = await fetch(url, {signal: c.signal, redirect: 'follow'});
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
            error: '',
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

async function probeWithRetries(url, timeoutMs, retries, checker) {
    const attempts = [];
    for (let i = 1; i <= retries; i += 1) {
        const r = await req(url, timeoutMs);
        const ok = checker(r);
        attempts.push({
            index: i,
            ok,
            status: r.status,
            durationMs: r.durationMs,
            error: cut(r.error || ''),
            sample: cut(r.error ? '' : r.text, 80),
        });
        if (ok) {
            return {ok: true, attempts};
        }
        if (i < retries) await sleep(180);
    }
    return {ok: false, attempts};
}

function isType4HardFailMessage(msg) {
    const s = String(msg || '');
    return s.includes('推荐和分类接口均异常') || s.includes('仅 1/4 接口正常') || s.includes('仅1/4接口正常');
}

function isClientSideOnlyMessage(msg) {
    const s = String(msg || '');
    return s.includes('non-http api requires client-side validation')
        || s.includes('client-side validation')
        || s.includes('unsupported scheme assets://')
        || s.includes('api reachable but ext is non-http or opaque');
}

function type4Urls(source) {
    const u = source.testUrls || {};
    const api = String(source.api || '').trim();
    const home = String(u.home || api).trim();
    const category = String(u.category || '').trim();
    return {
        home,
        category: category || (home ? `${home}${home.includes('?') ? '&' : '?'}ac=list&t=1&pg=1` : ''),
    };
}

function type3Urls(source) {
    const u = source.testUrls || {};
    const api = String(u.api || source.api || '').trim();
    const exts = [];
    const detailExt = source.details?.extCandidates;
    if (Array.isArray(detailExt)) {
        detailExt.forEach((x) => {
            if (x && typeof x.url === 'string' && x.url.trim()) exts.push(x.url.trim());
        });
    }
    if (Array.isArray(u.extCandidates)) {
        u.extCandidates.forEach((x) => {
            if (typeof x === 'string' && x.trim()) exts.push(x.trim());
        });
    }
    return {api, exts: Array.from(new Set(exts)).slice(0, 3)};
}

function isHttpUrl(url) {
    return /^https?:\/\//i.test(String(url || '').trim());
}

async function recheckType4(source, args) {
    const urls = type4Urls(source);
    if (!isHttpUrl(urls.home)) {
        return {
            classification: 'client_side_only',
            confirmedInvalid: false,
            reason: 'non_http_api',
            probes: {home: null, category: null},
        };
    }
    const home = await probeWithRetries(urls.home, args.timeoutMs, args.retries, (r) => r.ok && r.json && r.json.code === 1);
    const category = await probeWithRetries(urls.category, args.timeoutMs, args.retries, (r) => r.ok && r.json && r.json.code === 1);

    if (!home.ok && !category.ok) {
        return {
            classification: 'confirmed_invalid',
            confirmedInvalid: true,
            reason: 'home_and_category_failed_all_retries',
            probes: {home, category},
        };
    }
    return {
        classification: 'recovered_or_unstable',
        confirmedInvalid: false,
        reason: home.ok || category.ok ? 'at_least_one_endpoint_recovered' : 'unknown',
        probes: {home, category},
    };
}

async function recheckType3(source, args) {
    const urls = type3Urls(source);
    if (!isHttpUrl(urls.api)) {
        return {
            classification: 'client_side_only',
            confirmedInvalid: false,
            reason: 'non_http_api',
            probes: {api: null, ext: []},
        };
    }
    const api = await probeWithRetries(urls.api, args.timeoutMs, args.retries, (r) => r.ok && r.status < 400);
    const ext = [];
    for (const u of urls.exts) {
        const one = await probeWithRetries(u, args.timeoutMs, args.retries, (r) => r.ok && r.status < 400);
        ext.push({url: u, ...one});
    }
    const extAnyOk = ext.some((x) => x.ok);
    if (!api.ok && !extAnyOk) {
        return {
            classification: 'confirmed_invalid',
            confirmedInvalid: true,
            reason: 'api_and_ext_unreachable',
            probes: {api, ext},
        };
    }
    return {
        classification: 'recovered_or_unstable',
        confirmedInvalid: false,
        reason: api.ok || extAnyOk ? 'api_or_ext_recovered' : 'unknown',
        probes: {api, ext},
    };
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

function readDisabledFile(filePath) {
    if (!fs.existsSync(filePath)) return {keys: [], history: []};
    try {
        const j = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const keys = Array.isArray(j?.keys) ? j.keys : (Array.isArray(j) ? j : []);
        const history = Array.isArray(j?.history) ? j.history : [];
        return {keys: keys.filter(Boolean), history};
    } catch {
        return {keys: [], history: []};
    }
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const reportPath = args.reportPath || findLatestReportPath();
    if (!reportPath || !fs.existsSync(reportPath)) {
        throw new Error(`report not found: ${reportPath || 'EMPTY'}`);
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const batch = fmt();
    const outDir = path.join(ROOT, 'reports', 'source-prune', batch);
    await fsp.mkdir(outDir, {recursive: true});

    const errors = (report.sources || []).filter((s) => s.status === 'error');
    const startedAt = nowIso();

    const results = await runPool(errors, async (source) => {
        const base = {
            key: source.key,
            name: source.name,
            lang: source.lang || 'unknown',
            type: Number(source.type || 0),
            api: source.api || '',
            originalMessage: source.message || '',
            originalStatus: source.status,
        };

        if (isClientSideOnlyMessage(source.message)) {
            return {...base, classification: 'client_side_only', confirmedInvalid: false, reason: 'server_side_not_executable', probes: {}};
        }

        if (Number(source.type) === 4 || isType4HardFailMessage(source.message)) {
            const one = await recheckType4(source, args);
            return {...base, ...one};
        }

        const one = await recheckType3(source, args);
        return {...base, ...one};
    }, args.concurrency);

    const confirmedInvalid = results.filter((x) => x.confirmedInvalid);
    const clientSideOnly = results.filter((x) => x.classification === 'client_side_only');
    const recoveredOrUnstable = results.filter((x) => x.classification === 'recovered_or_unstable');

    const summary = {
        totalErrorsInReport: errors.length,
        confirmedInvalid: confirmedInvalid.length,
        clientSideOnly: clientSideOnly.length,
        recoveredOrUnstable: recoveredOrUnstable.length,
    };

    const disablePreview = {
        keys: confirmedInvalid.map((x) => x.key).sort(),
        meta: {
            generatedAt: nowIso(),
            basedOnReport: reportPath.replace(/\\/g, '/'),
            summary,
        },
        sources: confirmedInvalid.map((x) => ({
            key: x.key,
            name: x.name,
            lang: x.lang,
            type: x.type,
            api: x.api,
            reason: x.reason,
        })),
    };

    await fsp.writeFile(path.join(outDir, 'analysis.json'), JSON.stringify({
        meta: {
            startedAt,
            finishedAt: nowIso(),
            timeoutMs: args.timeoutMs,
            retries: args.retries,
            concurrency: args.concurrency,
            reportPath: reportPath.replace(/\\/g, '/'),
            apply: args.apply,
            disableFile: args.disableFile.replace(/\\/g, '/'),
        },
        summary,
        results,
        disablePreview,
    }, null, 2), 'utf8');

    const lines = [];
    lines.push('# 源失效复测与下线建议报告');
    lines.push('');
    lines.push(`- reportPath: ${reportPath.replace(/\\/g, '/')}`);
    lines.push(`- timeoutMs: ${args.timeoutMs}`);
    lines.push(`- retries: ${args.retries}`);
    lines.push(`- concurrency: ${args.concurrency}`);
    lines.push(`- error来源总数: ${summary.totalErrorsInReport}`);
    lines.push(`- 确认失效(建议下线): ${summary.confirmedInvalid}`);
    lines.push(`- 客户端专属(不应服务端删除): ${summary.clientSideOnly}`);
    lines.push(`- 复测恢复/不稳定(暂不删除): ${summary.recoveredOrUnstable}`);
    lines.push('');
    lines.push('## 建议下线 key');
    if (disablePreview.keys.length === 0) {
        lines.push('- 无');
    } else {
        disablePreview.keys.forEach((k) => lines.push(`- ${k}`));
    }
    await fsp.writeFile(path.join(outDir, 'summary.md'), lines.join('\n'), 'utf8');
    await fsp.writeFile(path.join(outDir, 'disable-preview.json'), JSON.stringify(disablePreview, null, 2), 'utf8');

    if (args.apply) {
        const current = readDisabledFile(args.disableFile);
        const merged = Array.from(new Set([...(current.keys || []), ...disablePreview.keys])).sort();
        const payload = {
            updatedAt: nowIso(),
            source: 'source-prune-invalid',
            basedOnReport: reportPath.replace(/\\/g, '/'),
            keys: merged,
            history: [
                ...(current.history || []),
                {
                    at: nowIso(),
                    added: disablePreview.keys,
                    total: merged.length,
                    from: path.join(outDir, 'disable-preview.json').replace(/\\/g, '/'),
                },
            ].slice(-50),
        };
        await fsp.mkdir(path.dirname(args.disableFile), {recursive: true});
        await fsp.writeFile(args.disableFile, JSON.stringify(payload, null, 2), 'utf8');
        await fsp.writeFile(path.join(outDir, 'apply-result.json'), JSON.stringify({
            disableFile: args.disableFile.replace(/\\/g, '/'),
            added: disablePreview.keys.length,
            totalDisabled: merged.length,
        }, null, 2), 'utf8');
    }

    console.log(`[source-prune-invalid] reportDir=${outDir}`);
    console.log(`[source-prune-invalid] error_total=${summary.totalErrorsInReport}, confirmed_invalid=${summary.confirmedInvalid}, client_only=${summary.clientSideOnly}, recovered_or_unstable=${summary.recoveredOrUnstable}`);
    if (args.apply) {
        console.log(`[source-prune-invalid] applied_disable_file=${args.disableFile}`);
    }
}

main().catch((e) => {
    console.error('[source-prune-invalid] failed:', e);
    process.exit(1);
});

