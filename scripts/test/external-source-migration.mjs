import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_INTERNAL_WORKSPACE = path.resolve(ROOT, 'external', 'workspace-sources');
const DEFAULT_WORKSPACE = fs.existsSync(DEFAULT_INTERNAL_WORKSPACE)
    ? DEFAULT_INTERNAL_WORKSPACE
    : path.resolve(ROOT, '..');

const nowIso = () => new Date().toISOString();
const ts = (d = new Date()) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
const cut = (s, n = 240) => (s === undefined || s === null ? '' : String(s).replace(/\r?\n/g, ' ').slice(0, n));

function parseArgs(argv) {
    const args = {
        workspaceRoot: DEFAULT_WORKSPACE,
        includeDirs: [],
        excludeDirs: [],
        apply: true,
        enableLinkData: true,
    };
    for (const a of argv) {
        if (a.startsWith('--workspace=')) {
            args.workspaceRoot = path.resolve(a.split('=').slice(1).join('=') || DEFAULT_WORKSPACE);
        } else if (a.startsWith('--include=')) {
            args.includeDirs = a.split('=').slice(1).join('=').split(',').map((x) => x.trim()).filter(Boolean);
        } else if (a.startsWith('--exclude=')) {
            args.excludeDirs = a.split('=').slice(1).join('=').split(',').map((x) => x.trim()).filter(Boolean);
        } else if (a === '--report-only') {
            args.apply = false;
        } else if (a === '--no-enable-link') {
            args.enableLinkData = false;
        }
    }
    return args;
}

function sha1(input) {
    return crypto.createHash('sha1').update(String(input)).digest('hex');
}

function slug(input, fallback = 'site') {
    const raw = String(input || '').toLowerCase();
    const s = raw.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return s || fallback;
}

function isHttpUrl(u) {
    return typeof u === 'string' && /^https?:\/\//i.test(u.trim());
}

function toStringValue(v) {
    if (typeof v === 'string') return v.trim();
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    return '';
}

function normalizeBool01(v, fallback = 1) {
    if (v === undefined || v === null || v === '') return fallback;
    if (typeof v === 'boolean') return v ? 1 : 0;
    const n = Number(v);
    if (Number.isFinite(n)) return n > 0 ? 1 : 0;
    const s = String(v).trim().toLowerCase();
    if (s === 'true' || s === 'yes') return 1;
    if (s === 'false' || s === 'no') return 0;
    return fallback;
}

function collectSiteArrays(parsed) {
    const arrays = [];
    const push = (arr, fromPath) => {
        if (!Array.isArray(arr)) return;
        arrays.push({fromPath, arr});
    };
    push(parsed, '$root');
    if (parsed && typeof parsed === 'object') {
        push(parsed.sites, 'sites');
        push(parsed?.sites?.data, 'sites.data');
        push(parsed?.data?.sites, 'data.sites');
        push(parsed?.sites?.list, 'sites.list');
    }
    return arrays;
}

function looksLikeSite(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
    const api = toStringValue(item.api || item.url || item.api_url || item.apiUrl);
    const name = toStringValue(item.name || item.site_name || item.title || item.key || item.id);
    return Boolean(api && name);
}

function resolveSiteType(item) {
    const t = Number(item?.type);
    if (Number.isFinite(t) && t > 0) return t;
    return 4;
}

function toCandidateSite(item, ctx, usedKeys) {
    const api = toStringValue(item.api || item.url || item.api_url || item.apiUrl);
    const name = toStringValue(item.name || item.site_name || item.title || item.key || item.id);
    const rawType = resolveSiteType(item);
    const mappedType = rawType === 3 ? 3 : 4;
    if (!api) return {skip: 'missing_api'};
    if (!name) return {skip: 'missing_name'};
    if (!isHttpUrl(api) && mappedType !== 3) return {skip: 'non_http_api'};
    const idBase = toStringValue(item.key || item.id || name);
    const apiHash = sha1(api).slice(0, 8);
    const keyBase = `ext_${slug(ctx.dirName, 'dir')}_${slug(idBase, 'site')}_${apiHash}`;
    let key = keyBase;
    let n = 2;
    while (usedKeys.has(key)) {
        key = `${keyBase}_${n}`;
        n += 1;
    }
    usedKeys.add(key);

    const ext = item.ext === undefined ? '' : item.ext;

    return {
        site: {
            key,
            name: `${name} [外部:${ctx.dirName}]`,
            type: mappedType,
            api: api.trim(),
            searchable: normalizeBool01(item.searchable, 1),
            quickSearch: normalizeBool01(item.quickSearch ?? item.quicksearch, 1),
            filterable: normalizeBool01(item.filterable, 0),
            ext,
            lang: `external_${rawType}`,
        },
        rawType,
    };
}

async function walkJsonFiles(rootDir, skipDirNames, onFile) {
    const stack = [rootDir];
    while (stack.length > 0) {
        const current = stack.pop();
        let entries = [];
        try {
            entries = await fsp.readdir(current, {withFileTypes: true});
        } catch {
            continue;
        }
        for (const ent of entries) {
            const p = path.join(current, ent.name);
            if (ent.isDirectory()) {
                if (skipDirNames.has(ent.name)) continue;
                stack.push(p);
                continue;
            }
            if (!ent.isFile()) continue;
            if (!ent.name.toLowerCase().endsWith('.json')) continue;
            await onFile(p);
        }
    }
}

function mergeSites(existingSites, importedSites) {
    const map = new Map();

    (existingSites || []).forEach((site) => {
        const key = String(site?.key || '').trim();
        if (!key) return;
        map.set(key, site);
    });

    // Imported entries have higher priority so that type/field fixes can覆盖旧数据
    (importedSites || []).forEach((site) => {
        const key = String(site?.key || '').trim();
        if (!key) return;
        map.set(key, site);
    });

    return Array.from(map.values());
}

function buildSummaryMd(ctx) {
    const lines = [];
    lines.push('# 外部源接入迁移报告');
    lines.push('');
    lines.push(`- 批次: ${ctx.batch}`);
    lines.push(`- 时间: ${ctx.startedAt} ~ ${ctx.finishedAt}`);
    lines.push(`- 工作区: ${ctx.workspaceRoot}`);
    lines.push(`- 扫描目录数: ${ctx.dirCount}`);
    lines.push(`- 扫描JSON文件数: ${ctx.stats.jsonFiles}`);
    lines.push(`- 识别候选文件数: ${ctx.stats.candidateFiles}`);
    lines.push(`- 解析失败文件数: ${ctx.stats.parseFailed}`);
    lines.push(`- 发现可转换源条数: ${ctx.stats.discovered}`);
    lines.push(`- 过滤跳过条数: ${ctx.stats.skipped}`);
    lines.push(`- 本次新增条数: ${ctx.stats.added}`);
    lines.push(`- 合并后link_data总数: ${ctx.stats.totalAfterMerge}`);
    lines.push(`- 落盘写入: ${ctx.apply ? '是' : '否(仅报告)'}`);
    lines.push(`- 自动启用挂载: ${ctx.enableLinkData ? '是' : '否'}`);
    lines.push('');
    lines.push('## 目录识别结果');
    Object.entries(ctx.byDir).sort((a, b) => a[0].localeCompare(b[0])).forEach(([name, x]) => {
        lines.push(`- ${name}: 文件=${x.files}, 候选=${x.candidateFiles}, 发现=${x.discovered}, 跳过=${x.skipped}`);
    });
    lines.push('');
    lines.push('## 说明');
    lines.push('- 仅自动接入可直接执行的HTTP源。');
    lines.push('- 非HTTP API（如 csp_/assets://）会保留在“跳过明细”，需人工改造。');
    lines.push('- 本次将外部源统一转为 type=4 以适配 drpy-node 接口检测链路。');
    return lines.join('\n');
}

function buildImplementationMd(ctx) {
    const lines = [];
    lines.push(`# 外部源接入实施记录（批次 ${ctx.batch}）`);
    lines.push('');
    lines.push('## 1. 目标');
    lines.push('- 将工作区同级目录中的可识别源配置接入 drpy-node。');
    lines.push('- 生成可复核的发现清单、接入结果与跳过原因。');
    lines.push('');
    lines.push('## 2. 执行步骤');
    lines.push('1. 遍历同级目录，递归扫描 JSON 文件。');
    lines.push('2. 识别 sites 结构并提取 name/api/source type。');
    lines.push('3. 仅保留 HTTP 源，统一归一化为 type=4。');
    lines.push('4. 与已有 link_data 去重合并并写入 data/settings/link_data.json。');
    lines.push('5. 写入 config/env.json 的 enable_link_data=1（可关闭）。');
    lines.push('6. 输出 summary/discovery/candidates/skipped 报告。');
    lines.push('');
    lines.push('## 3. 关键落盘');
    lines.push(`- 接入文件: \`data/settings/link_data.json\``);
    lines.push(`- 环境开关: \`config/env.json\``);
    lines.push(`- 报告目录: \`reports/source-migration/${ctx.batch}\``);
    lines.push('');
    lines.push('## 4. 边界');
    lines.push('- 纯客户端脚本、加密插件、非HTTP协议不做自动接入。');
    lines.push('- 自动检测不等于人工业务验收，人工复核请看后续 source-checker 的 checklist。');
    return lines.join('\n');
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const startedAt = nowIso();
    const batch = ts();
    const reportDir = path.join(ROOT, 'reports', 'source-migration', batch);
    await fsp.mkdir(reportDir, {recursive: true});

    const skipTop = new Set([
        'drpy-node',
        'node_modules',
        '.git',
        '.ace-tool',
        'scripts',
    ]);
    const skipDeep = new Set([
        'node_modules',
        '.git',
        '.ace-tool',
        '.pytest_cache',
        '__pycache__',
        'analysis_dump',
        'analysis_dump_v2',
        'analysis_dump_static',
    ]);
    args.excludeDirs.forEach((d) => skipTop.add(d));

    const topEntries = await fsp.readdir(args.workspaceRoot, {withFileTypes: true});
    let dirs = topEntries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .filter((name) => !skipTop.has(name));
    if (args.includeDirs.length > 0) {
        const includeSet = new Set(args.includeDirs);
        dirs = dirs.filter((d) => includeSet.has(d));
    }

    const usedKeys = new Set();
    const discoveredSites = [];
    const discovery = [];
    const skippedItems = [];
    const byDir = {};
    const stats = {
        jsonFiles: 0,
        candidateFiles: 0,
        parseFailed: 0,
        discovered: 0,
        skipped: 0,
        added: 0,
        totalAfterMerge: 0,
    };

    for (const dirName of dirs) {
        byDir[dirName] = {files: 0, candidateFiles: 0, discovered: 0, skipped: 0};
        const dirPath = path.join(args.workspaceRoot, dirName);

        await walkJsonFiles(dirPath, skipDeep, async (filePath) => {
            stats.jsonFiles += 1;
            byDir[dirName].files += 1;

            let txt;
            try {
                txt = await fsp.readFile(filePath, 'utf8');
            } catch {
                return;
            }

            let parsed;
            try {
                parsed = JSON.parse(txt);
            } catch (e) {
                stats.parseFailed += 1;
                discovery.push({
                    dir: dirName,
                    file: path.relative(args.workspaceRoot, filePath).replace(/\\/g, '/'),
                    ok: false,
                    reason: `json_parse_error: ${cut(e.message, 120)}`,
                });
                return;
            }

            const arrays = collectSiteArrays(parsed);
            let best = null;
            for (const x of arrays) {
                const matched = x.arr.filter(looksLikeSite);
                if (!best || matched.length > best.matched.length) {
                    best = {...x, matched};
                }
            }
            if (!best || best.matched.length === 0) {
                discovery.push({
                    dir: dirName,
                    file: path.relative(args.workspaceRoot, filePath).replace(/\\/g, '/'),
                    ok: false,
                    reason: 'no_site_array',
                });
                return;
            }

            stats.candidateFiles += 1;
            byDir[dirName].candidateFiles += 1;

            const ctx = {dirName, filePath};
            let discoveredInFile = 0;
            let skippedInFile = 0;
            const skipReasons = {};

            for (const item of best.arr) {
                if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
                const converted = toCandidateSite(item, ctx, usedKeys);
                if (!converted.site) {
                    skippedInFile += 1;
                    stats.skipped += 1;
                    byDir[dirName].skipped += 1;
                    skipReasons[converted.skip] = (skipReasons[converted.skip] || 0) + 1;
                    skippedItems.push({
                        dir: dirName,
                        file: path.relative(args.workspaceRoot, filePath).replace(/\\/g, '/'),
                        reason: converted.skip,
                        sample: {
                            key: item.key,
                            name: item.name,
                            api: item.api || item.url || '',
                            type: item.type,
                        },
                    });
                    continue;
                }

                discoveredSites.push(converted.site);
                discoveredInFile += 1;
                stats.discovered += 1;
                byDir[dirName].discovered += 1;
            }

            discovery.push({
                dir: dirName,
                file: path.relative(args.workspaceRoot, filePath).replace(/\\/g, '/'),
                ok: true,
                sourcePath: best.fromPath,
                totalItems: best.arr.length,
                matchedItems: best.matched.length,
                discovered: discoveredInFile,
                skipped: skippedInFile,
                skipReasons,
            });
        });
    }

    const linkDataPath = path.join(ROOT, 'data', 'settings', 'link_data.json');
    let existingLink = {spider: '', sites: []};
    if (fs.existsSync(linkDataPath)) {
        try {
            const oldRaw = await fsp.readFile(linkDataPath, 'utf8');
            const oldObj = JSON.parse(oldRaw);
            existingLink = {
                ...oldObj,
                sites: Array.isArray(oldObj?.sites) ? oldObj.sites : [],
            };
        } catch {
            existingLink = {spider: '', sites: []};
        }
    }
    const mergedSites = mergeSites(existingLink.sites, discoveredSites);
    stats.added = Math.max(0, mergedSites.length - (existingLink.sites || []).length);
    stats.totalAfterMerge = mergedSites.length;

    const newLink = {
        ...existingLink,
        sites: mergedSites,
    };

    if (args.apply) {
        await fsp.mkdir(path.dirname(linkDataPath), {recursive: true});
        await fsp.writeFile(linkDataPath, JSON.stringify(newLink, null, 2), 'utf8');
        if (args.enableLinkData) {
            const envPath = path.join(ROOT, 'config', 'env.json');
            let envObj = {};
            if (fs.existsSync(envPath)) {
                try {
                    envObj = JSON.parse(await fsp.readFile(envPath, 'utf8'));
                } catch {
                    envObj = {};
                }
            }
            envObj.enable_link_data = '1';
            if (envObj.link_url === undefined) envObj.link_url = '';
            await fsp.writeFile(envPath, JSON.stringify(envObj, null, 2), 'utf8');
        }
    }

    const finishedAt = nowIso();
    const summary = buildSummaryMd({
        batch,
        startedAt,
        finishedAt,
        workspaceRoot: args.workspaceRoot,
        dirCount: dirs.length,
        byDir,
        stats,
        apply: args.apply,
        enableLinkData: args.enableLinkData,
    });
    const implementation = buildImplementationMd({batch});

    await fsp.writeFile(path.join(reportDir, 'summary.md'), summary, 'utf8');
    await fsp.writeFile(path.join(reportDir, 'implementation-log.md'), implementation, 'utf8');
    await fsp.writeFile(path.join(reportDir, 'discovery.json'), JSON.stringify(discovery, null, 2), 'utf8');
    await fsp.writeFile(path.join(reportDir, 'candidates.json'), JSON.stringify(discoveredSites, null, 2), 'utf8');
    await fsp.writeFile(path.join(reportDir, 'skipped-items.json'), JSON.stringify(skippedItems, null, 2), 'utf8');
    await fsp.writeFile(path.join(reportDir, 'link_data.after.json'), JSON.stringify(newLink, null, 2), 'utf8');

    const integratedNames = mergedSites.map((s) => `${s.key}\t${s.name}\t${s.api}`);
    await fsp.writeFile(path.join(reportDir, 'integrated-sites.tsv'), integratedNames.join('\n'), 'utf8');

    console.log(`[external-source-migration] reportDir=${reportDir}`);
    console.log(`[external-source-migration] dirs=${dirs.length}, json=${stats.jsonFiles}, candidateFiles=${stats.candidateFiles}`);
    console.log(`[external-source-migration] discovered=${stats.discovered}, skipped=${stats.skipped}, added=${stats.added}, total=${stats.totalAfterMerge}`);
    if (!args.apply) {
        console.log('[external-source-migration] report-only mode');
    }
}

main().catch((e) => {
    console.error('[external-source-migration] failed:', e);
    process.exit(1);
});
