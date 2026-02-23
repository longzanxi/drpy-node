import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_WORKSPACE = path.resolve(ROOT, '..');
const DEFAULT_TARGET = path.join(ROOT, 'external', 'workspace-sources');

const EXTERNAL_DIRS = [
    '.4kvm.tv',
    '.cz233.com',
    '.netflixgc.com',
    '\u64ad\u5267\u5f71\u89c6',
    '\u72ec\u64ad\u5e93',
    'aiyifan',
    'bgm.girigirilove.com',
    'kuangren.us',
    'kanbot.com',
    'iyf.tv',
    'libvio',
];

const SAFE_COPY_ITEMS = {
    '.4kvm.tv': ['main/report/result.json'],
    '.cz233.com': ['main/ctf_extract_flag.js'],
    '.netflixgc.com': ['main/netflixgc_extractor_worker.mjs'],
    '\u64ad\u5267\u5f71\u89c6': ['main/result-116295-1-1.json'],
    '\u72ec\u64ad\u5e93': ['main/out'],
    'aiyifan': [
        'ctf/play_channel_chrome.json',
        'ctf/play_channel_msedge.json',
        'ctf/play_api_now.json',
        'ctf/play_api_576_now.json',
        'ctf/play_api_720_now.json',
        'worker-bonus/tmp_fetch_regression.json',
    ],
    'bgm.girigirilove.com': ['main/worker/cf_worker_bgm_extractor.js'],
    'kuangren.us': ['main/flag.json', 'main/dbg_E.json'],
    'kanbot.com': ['main/artifacts/worker_extract.json'],
    'iyf.tv': [
        'out_protocol_rHdszVLeZIT_live_now_source_urls.txt',
        'out_protocol_rHdszVLeZIT_real_source_urls.txt',
        'out_source_rHdszVLeZIT_now_links.txt',
    ],
    'libvio': ['ctf_libvio.js', 'ast_env.js', 'pw_capture_714893137_yd.py'],
};

const SKIP_DIR_NAMES = new Set([
    '.git',
    '.ace-tool',
    '.pytest_cache',
    '__pycache__',
    'node_modules',
    '.venv',
    'venv',
    'analysis_dump',
    'analysis_dump_v2',
    'analysis_dump_static',
]);

const POSIX_SEP = '/';
const SKIP_DIR_PREFIXES = ['batch_'];
const KEEP_TMP_FILES = new Set(['tmp_fetch_regression.json']);

const ts = (d = new Date()) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
const nowIso = () => new Date().toISOString();

function parseArgs(argv) {
    const args = {
        workspaceRoot: DEFAULT_WORKSPACE,
        targetRoot: DEFAULT_TARGET,
        includeDirs: EXTERNAL_DIRS.slice(),
        cleanTarget: true,
        apply: true,
        fullCopy: false,
    };
    for (const a of argv) {
        if (a.startsWith('--workspace=')) {
            args.workspaceRoot = path.resolve(a.split('=').slice(1).join('=') || DEFAULT_WORKSPACE);
        } else if (a.startsWith('--target=')) {
            args.targetRoot = path.resolve(a.split('=').slice(1).join('=') || DEFAULT_TARGET);
        } else if (a.startsWith('--include=')) {
            args.includeDirs = a.split('=').slice(1).join('=').split(',').map((x) => x.trim()).filter(Boolean);
        } else if (a === '--keep-target') {
            args.cleanTarget = false;
        } else if (a === '--report-only') {
            args.apply = false;
        } else if (a === '--full-copy') {
            args.fullCopy = true;
        }
    }
    return args;
}

async function pathExists(p) {
    try {
        await fsp.access(p, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

function shouldSkipDir(name) {
    const n = String(name || '').trim();
    if (SKIP_DIR_NAMES.has(n)) return true;
    const lower = n.toLowerCase();
    return SKIP_DIR_PREFIXES.some((x) => lower.startsWith(String(x).toLowerCase()));
}

function toPosixPath(p) {
    return String(p || '').replace(/\\/g, POSIX_SEP);
}

function shouldSkipFile(relPathPosix) {
    const rel = String(relPathPosix || '');
    const base = path.posix.basename(rel);
    const lower = base.toLowerCase();
    if (/^worker(?:令牌|token).*(?:\.txt|,txt)$/i.test(base)) return true;
    if ((/^aiyifan\/worker-bonus\/tmp_/i.test(rel) || /^worker-bonus\/tmp_/i.test(rel))
        && !/tmp_fetch_regression\.json$/i.test(rel)) return true;
    if (lower.includes('cookie')) return true;
    if (lower.startsWith('tmp_') && !KEEP_TMP_FILES.has(lower)) return true;
    if ((lower.includes('token') || lower.includes('mailtm')) && /\.(txt|json)$/i.test(lower)) return true;
    if (/\.pem$/i.test(base) || /\.key$/i.test(base)) return true;
    return false;
}

async function copyTree(srcDir, dstDir, stats, sourceRoot) {
    await fsp.mkdir(dstDir, {recursive: true});
    const entries = await fsp.readdir(srcDir, {withFileTypes: true});
    for (const ent of entries) {
        const srcPath = path.join(srcDir, ent.name);
        const dstPath = path.join(dstDir, ent.name);
        if (ent.isDirectory()) {
            if (shouldSkipDir(ent.name)) {
                stats.skippedDirs.push(srcPath);
                continue;
            }
            await copyTree(srcPath, dstPath, stats, sourceRoot);
            continue;
        }
        if (!ent.isFile()) continue;
        const rel = toPosixPath(path.relative(sourceRoot, srcPath));
        if (shouldSkipFile(rel)) {
            stats.skippedFiles.push(srcPath);
            continue;
        }
        await fsp.mkdir(path.dirname(dstPath), {recursive: true});
        await fsp.copyFile(srcPath, dstPath);
        const st = await fsp.stat(dstPath);
        stats.files += 1;
        stats.bytes += st.size;
    }
}

async function copyItemByRule(srcRoot, dstRoot, relItem, stats) {
    const srcPath = path.join(srcRoot, relItem);
    if (!await pathExists(srcPath)) {
        stats.missingRuleItems.push(srcPath);
        return;
    }
    const st = await fsp.stat(srcPath);
    const dstPath = path.join(dstRoot, relItem);
    if (st.isDirectory()) {
        await copyTree(srcPath, dstPath, stats, srcRoot);
        return;
    }
    if (!st.isFile()) return;
    const rel = toPosixPath(path.relative(srcRoot, srcPath));
    if (shouldSkipFile(rel)) {
        stats.skippedFiles.push(srcPath);
        return;
    }
    await fsp.mkdir(path.dirname(dstPath), {recursive: true});
    await fsp.copyFile(srcPath, dstPath);
    stats.files += 1;
    stats.bytes += st.size;
}

function toMb(bytes) {
    return Number((Number(bytes || 0) / 1024 / 1024).toFixed(2));
}

function buildSummary(ctx) {
    const lines = [];
    lines.push('# 外部源内置同步报告');
    lines.push('');
    lines.push(`- 时间: ${ctx.startedAt} ~ ${ctx.finishedAt}`);
    lines.push(`- workspaceRoot: ${ctx.workspaceRoot}`);
    lines.push(`- targetRoot: ${ctx.targetRoot}`);
    lines.push(`- apply: ${ctx.apply ? '是' : '否(仅报告)'}`);
    lines.push(`- mode: ${ctx.fullCopy ? 'full-copy' : 'safe-runtime-only'}`);
    lines.push(`- cleanTarget: ${ctx.cleanTarget ? '是' : '否'}`);
    lines.push(`- 目录总数: ${ctx.totalDirs}`);
    lines.push(`- 成功复制目录: ${ctx.copiedDirs}`);
    lines.push(`- 缺失目录: ${ctx.missingDirs}`);
    lines.push(`- 复制文件数: ${ctx.totalFiles}`);
    lines.push(`- 复制体积(MB): ${toMb(ctx.totalBytes)}`);
    lines.push('');
    lines.push('## 目录详情');
    ctx.dirResults.forEach((x) => {
        lines.push(`- ${x.dir}: ${x.status}, files=${x.files}, sizeMB=${toMb(x.bytes)}, src=${x.src}, dst=${x.dst}`);
    });
    lines.push('');
    lines.push('## 说明');
    lines.push('- 该脚本把外部目录镜像到仓库内置目录，供 Docker/GitHub 构建直接使用。');
    lines.push('- safe-runtime-only 模式仅复制运行链路所需文件；如需完整镜像可用 --full-copy。');
    lines.push('- 已跳过 node_modules/.git 等非必要目录，避免无业务价值的膨胀。');
    lines.push('- 已过滤明显敏感文件（如令牌/临时凭据文件），防止凭据泄露到仓库。');
    return lines.join('\n');
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const startedAt = nowIso();
    const batch = ts();
    const reportDir = path.join(ROOT, 'reports', 'external-internalize', batch);
    await fsp.mkdir(reportDir, {recursive: true});

    const dirResults = [];
    let totalFiles = 0;
    let totalBytes = 0;
    let copiedDirs = 0;
    let missingDirs = 0;

    if (args.apply) {
        if (args.cleanTarget && await pathExists(args.targetRoot)) {
            await fsp.rm(args.targetRoot, {recursive: true, force: true});
        }
        await fsp.mkdir(args.targetRoot, {recursive: true});
    }

    for (const dirName of args.includeDirs) {
        const src = path.join(args.workspaceRoot, dirName);
        const dst = path.join(args.targetRoot, dirName);
        if (!await pathExists(src)) {
            missingDirs += 1;
            dirResults.push({
                dir: dirName,
                status: 'missing',
                files: 0,
                bytes: 0,
                src,
                dst,
                skippedDirs: [],
            });
            continue;
        }
        const stat = {
            files: 0,
            bytes: 0,
            skippedDirs: [],
            skippedFiles: [],
            missingRuleItems: [],
        };
        if (args.apply) {
            const rules = SAFE_COPY_ITEMS[dirName];
            if (!args.fullCopy && Array.isArray(rules) && rules.length > 0) {
                for (const relItem of rules) {
                    await copyItemByRule(src, dst, relItem, stat);
                }
            } else {
                await copyTree(src, dst, stat, src);
            }
        }
        copiedDirs += 1;
        totalFiles += stat.files;
        totalBytes += stat.bytes;
        dirResults.push({
            dir: dirName,
                status: args.apply ? 'copied' : 'discovered',
                files: stat.files,
                bytes: stat.bytes,
                src,
                dst,
                skippedDirs: stat.skippedDirs,
                skippedFiles: stat.skippedFiles,
                missingRuleItems: stat.missingRuleItems,
            });
    }

    const finishedAt = nowIso();
    const manifest = {
        batch,
        startedAt,
        finishedAt,
        workspaceRoot: args.workspaceRoot,
        targetRoot: args.targetRoot,
        includeDirs: args.includeDirs,
        cleanTarget: args.cleanTarget,
        apply: args.apply,
        fullCopy: args.fullCopy,
        totals: {
            totalDirs: args.includeDirs.length,
            copiedDirs,
            missingDirs,
            totalFiles,
            totalBytes,
            totalSizeMB: toMb(totalBytes),
        },
        dirResults,
    };
    const summary = buildSummary({
        ...manifest.totals,
        startedAt,
        finishedAt,
        workspaceRoot: args.workspaceRoot,
        targetRoot: args.targetRoot,
        cleanTarget: args.cleanTarget,
        apply: args.apply,
        fullCopy: args.fullCopy,
        dirResults,
    });

    await fsp.writeFile(path.join(reportDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
    await fsp.writeFile(path.join(reportDir, 'summary.md'), summary, 'utf8');
    if (args.apply) {
        await fsp.writeFile(path.join(args.targetRoot, '_internalized_manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
    }

    console.log(JSON.stringify({
        ok: true,
        batch,
        reportDir: path.relative(ROOT, reportDir).replace(/\\/g, '/'),
        targetRoot: path.relative(ROOT, args.targetRoot).replace(/\\/g, '/'),
        totals: manifest.totals,
    }, null, 2));
}

main().catch((error) => {
    console.error(JSON.stringify({
        ok: false,
        error: String(error?.stack || error?.message || error),
    }, null, 2));
    process.exit(1);
});
