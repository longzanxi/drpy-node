import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const ts = (d = new Date()) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;

function parseArgs(argv) {
    const out = {
        migrationBatch: '',
        checkerBatch: '',
    };
    for (const a of argv) {
        if (a.startsWith('--migration-batch=')) out.migrationBatch = a.split('=').slice(1).join('=').trim();
        if (a.startsWith('--checker-batch=')) out.checkerBatch = a.split('=').slice(1).join('=').trim();
    }
    return out;
}

function latestSubDir(baseDir) {
    if (!fs.existsSync(baseDir)) return '';
    const arr = fs.readdirSync(baseDir, {withFileTypes: true})
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort();
    if (arr.length === 0) return '';
    return arr[arr.length - 1];
}

function safeName(x) {
    return String(x || '').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'source';
}

function cut(s, n = 260) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/\r?\n/g, ' ').slice(0, n);
}

function sourceMd(s) {
    const lines = [];
    lines.push(`# 源验证报告: ${s.name}`);
    lines.push('');
    lines.push(`- key: ${s.key}`);
    lines.push(`- status: ${s.status}`);
    lines.push(`- message: ${s.message || ''}`);
    lines.push(`- type/lang: ${s.type}/${s.lang}`);
    lines.push(`- api: ${s.api || ''}`);
    lines.push(`- durationMs: ${s.durationMs || 0}`);
    lines.push('');
    lines.push('## 测试URL');
    Object.entries(s.testUrls || {}).forEach(([k, v]) => lines.push(`- ${k}: ${v}`));
    if (!Object.keys(s.testUrls || {}).length) lines.push('- (空)');
    lines.push('');
    lines.push('## 详情');
    const details = s.details || {};
    Object.entries(details).forEach(([k, v]) => {
        lines.push(`- ${k}: ${v?.success ? 'success' : 'fail'} | ${cut(v?.error || '', 200)} | ${cut(v?.url || '', 200)}`);
    });
    if (!Object.keys(details).length) lines.push('- (空)');
    lines.push('');
    lines.push('## 人工复核');
    lines.push('- [ ] 通过');
    lines.push('- [ ] 失败');
    lines.push('- 备注:');
    return lines.join('\n');
}

function summaryMd(ctx) {
    const lines = [];
    lines.push('# 外部源全量验证汇总');
    lines.push('');
    lines.push(`- 迁移批次: ${ctx.migrationBatch}`);
    lines.push(`- 检测批次: ${ctx.checkerBatch}`);
    lines.push(`- 外部接入总数: ${ctx.total}`);
    lines.push(`- success: ${ctx.success}`);
    lines.push(`- error: ${ctx.error}`);
    lines.push(`- pending: ${ctx.pending}`);
    lines.push('');
    lines.push('## 各源报告');
    ctx.sources.forEach((s) => {
        lines.push(`- ${s.name} | ${s.status} | source-${safeName(s.key)}.md`);
    });
    lines.push('');
    lines.push('## 结论');
    lines.push('- success 为自动检测通过。');
    lines.push('- error/pending 需结合 manual-checklist 做人工复核。');
    return lines.join('\n');
}

function manualChecklistMd(sources) {
    const rows = sources.filter((s) => s.status !== 'success');
    const lines = [];
    lines.push('# 外部源人工复核清单');
    lines.push('');
    lines.push(`- 待复核数量: ${rows.length}`);
    lines.push('');
    rows.forEach((s, i) => {
        lines.push(`## ${i + 1}. ${s.name}`);
        lines.push(`- key: ${s.key}`);
        lines.push(`- status: ${s.status}`);
        lines.push(`- message: ${s.message || ''}`);
        lines.push(`- api: ${s.api || ''}`);
        Object.entries(s.testUrls || {}).forEach(([k, v]) => lines.push(`- ${k}: ${v}`));
        lines.push('- 人工结论: [ ] 通过  [ ] 失败');
        lines.push('- 备注:');
        lines.push('');
    });
    return lines.join('\n');
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const migrationBase = path.join(ROOT, 'reports', 'source-migration');
    const checkerBase = path.join(ROOT, 'reports', 'source-checker-batch');
    const migrationBatch = args.migrationBatch || latestSubDir(migrationBase);
    const checkerBatch = args.checkerBatch || latestSubDir(checkerBase);
    if (!migrationBatch || !checkerBatch) {
        throw new Error('missing migration/checker batch');
    }

    const migrationDir = path.join(migrationBase, migrationBatch);
    const checkerDir = path.join(checkerBase, checkerBatch);
    const linkData = JSON.parse(await fsp.readFile(path.join(migrationDir, 'link_data.after.json'), 'utf8'));
    const checker = JSON.parse(await fsp.readFile(path.join(checkerDir, 'report.json'), 'utf8'));

    const externalSites = Array.isArray(linkData?.sites) ? linkData.sites : [];
    const checkerMap = new Map((checker.sources || []).map((x) => [x.key, x]));
    const selected = externalSites.map((s) => checkerMap.get(s.key)).filter(Boolean);

    const outDir = path.join(ROOT, 'reports', 'source-migration-validation', ts());
    await fsp.mkdir(outDir, {recursive: true});

    let success = 0;
    let error = 0;
    let pending = 0;
    for (const s of selected) {
        if (s.status === 'success') success += 1;
        else if (s.status === 'pending') pending += 1;
        else error += 1;
        await fsp.writeFile(path.join(outDir, `source-${safeName(s.key)}.md`), sourceMd(s), 'utf8');
    }

    await fsp.writeFile(path.join(outDir, 'summary.md'), summaryMd({
        migrationBatch,
        checkerBatch,
        total: selected.length,
        success,
        error,
        pending,
        sources: selected,
    }), 'utf8');
    await fsp.writeFile(path.join(outDir, 'manual-checklist.md'), manualChecklistMd(selected), 'utf8');
    await fsp.writeFile(path.join(outDir, 'raw-selected-sources.json'), JSON.stringify(selected, null, 2), 'utf8');

    console.log(`[external-source-validation-report] outDir=${outDir}`);
    console.log(`[external-source-validation-report] total=${selected.length}, success=${success}, error=${error}, pending=${pending}`);
}

main().catch((e) => {
    console.error('[external-source-validation-report] failed:', e);
    process.exit(1);
});

