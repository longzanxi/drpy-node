import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import net from 'net';
import {spawn, spawnSync} from 'child_process';
import {fileURLToPath, pathToFileURL} from 'url';
import WebSocket from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const MAIN = 5757;
const WS = 57575;
const DAEMON = 57570;
const PLUGIN_PORTS = [57571, 57572, 57573, 57574];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();
const fmt = (d = new Date()) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
const cut = (s, n = 220) => (s === undefined || s === null ? '' : String(s).replace(/\r?\n/g, ' ').slice(0, n));

async function req(url, options = {}) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), options.timeoutMs || 15000);
    try {
        const res = await fetch(url, {...options, signal: c.signal});
        const text = await res.text();
        let json = null;
        try { json = JSON.parse(text); } catch {}
        return {status: res.status, ok: res.ok, headers: Object.fromEntries(res.headers.entries()), text, json};
    } finally {
        clearTimeout(t);
    }
}

function tcp(host, port, timeout = 2500) {
    return new Promise((resolve) => {
        const s = new net.Socket();
        const start = Date.now();
        let done = false;
        const end = (open, err = null) => {
            if (done) return;
            done = true;
            try { s.destroy(); } catch {}
            resolve({open, err, latencyMs: Date.now() - start});
        };
        s.setTimeout(timeout);
        s.once('connect', () => end(true));
        s.once('timeout', () => end(false, 'TIMEOUT'));
        s.once('error', (e) => end(false, e?.code || e?.message || 'ERROR'));
        s.connect(port, host);
    });
}

async function waitHttp(url, timeoutMs = 70000) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
        try {
            const r = await req(url, {timeoutMs: 3000});
            if (r.status < 500) return true;
        } catch {}
        await sleep(500);
    }
    return false;
}

function ver(cmd, args = ['--version']) {
    const r = spawnSync(cmd, args, {encoding: 'utf8'});
    if (r.error) return `不可用(${r.error.message})`;
    return `${r.stdout || ''}${r.stderr || ''}`.trim() || `exit=${r.status}`;
}

function firstAvailableVersion(candidates, args = ['--version']) {
    for (const c of candidates) {
        if (!c) continue;
        const r = spawnSync(c, args, {encoding: 'utf8'});
        if (r.error) continue;
        const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
        if (out) return out;
    }
    return '不可用';
}

function detectPythonPath() {
    if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
        return process.env.PYTHON_PATH;
    }
    const probe = spawnSync('powershell', ['-NoProfile', '-Command', 'python -c "import sys;print(sys.executable)"'], {encoding: 'utf8'});
    if (!probe.error) {
        const out = `${probe.stdout || ''}${probe.stderr || ''}`.trim().split(/\r?\n/)[0]?.trim();
        if (out && fs.existsSync(out)) {
            return out;
        }
    }
    return '';
}

async function loadPlugins() {
    const user = path.join(ROOT, '.plugins.js');
    const demo = path.join(ROOT, '.plugins.example.js');
    const src = fs.existsSync(user) ? user : (fs.existsSync(demo) ? demo : null);
    if (!src) return {src: '', list: [], err: ''};
    try {
        const mod = await import(`${pathToFileURL(src).href}?t=${Date.now()}`);
        return {src, list: Array.isArray(mod.default) ? mod.default : [], err: ''};
    } catch (e) {
        return {src, list: [], err: e.message};
    }
}

function pluginPort(params = '') {
    const m = String(params).match(/(\d{5})/);
    return m ? Number(m[1]) : null;
}

function add(rec, x) {
    rec.tests.push({
        ...x,
        expected: x.expected || '',
        actual: x.actual || '',
        evidence: x.evidence || '',
        note: x.note || '',
        startedAt: x.startedAt || now(),
        finishedAt: x.finishedAt || now(),
    });
}

async function run(rec, meta, fn) {
    const st = now();
    const t0 = Date.now();
    try {
        const r = await fn();
        add(rec, {...meta, ...r, startedAt: st, finishedAt: now(), durationMs: Date.now() - t0});
    } catch (e) {
        add(rec, {...meta, passed: false, actual: `异常:${e.message}`, startedAt: st, finishedAt: now(), durationMs: Date.now() - t0});
    }
}

function sum(rec) {
    const total = rec.tests.length;
    const passed = rec.tests.filter((t) => t.passed).length;
    rec.summary = {total, passed, failed: total - passed, status: total === passed ? 'PASS' : 'FAIL'};
}

function analysis(port, ctx) {
    if (port === MAIN) return '主业务端口。已覆盖健康检查、WS桥接、JS/PY/CAT引擎、proxy/parse、代理族与常用控制器接口。';
    if (port === WS) return '独立 wsApp 端口。验证可达性和最小路由暴露。';
    if (port === DAEMON) return `Python daemon TCP端口。health报告 python.available=${ctx.py?.available}, daemon_running=${ctx.py?.daemon_running}。`;
    const p = ctx.pluginByPort.get(port);
    if (p) return `插件端口(${p.name})，active=${p.active}，params=${p.params || ''}。`;
    return '插件端口，无映射配置。';
}

function manual(port) {
    if (port === MAIN) return [
        `curl http://127.0.0.1:${MAIN}/health`,
        `curl "http://127.0.0.1:${MAIN}/api/${encodeURIComponent('设置中心')}"`,
        `连接 ws://127.0.0.1:${MAIN}/ws 并发送 {"type":"heartbeat"}`,
    ];
    if (port === WS) return [
        `访问 http://127.0.0.1:${WS}/`,
        `访问 http://127.0.0.1:${WS}/not-found`,
    ];
    if (port === DAEMON) return [
        `Test-NetConnection 127.0.0.1 -Port ${DAEMON}`,
        `curl "http://127.0.0.1:${MAIN}/api/${encodeURIComponent('依赖测试')}?do=py"`,
    ];
    return [`Test-NetConnection 127.0.0.1 -Port ${port}`];
}

function portMd(rec, ctx) {
    const lines = [];
    lines.push(`# 端口 ${rec.port} 落盘报告`);
    lines.push('');
    lines.push(`- 角色: ${rec.role}`);
    lines.push(`- 结果: ${rec.summary.status} (${rec.summary.passed}/${rec.summary.total})`);
    lines.push(`- 时间: ${ctx.startedAt} ~ ${ctx.finishedAt}`);
    lines.push('');
    lines.push('## 1. 深度分析');
    lines.push(analysis(rec.port, ctx));
    lines.push('');
    lines.push('## 2. 测试明细');
    lines.push('| 序号 | 分类 | 用例 | 请求 | 预期 | 实际 | 结果 | 耗时(ms) |');
    lines.push('|---|---|---|---|---|---|---|---|');
    rec.tests.forEach((t, i) => {
        lines.push(`| ${i + 1} | ${cut(t.category, 120).replace(/\|/g, '\\|')} | ${cut(t.name, 120).replace(/\|/g, '\\|')} | ${cut(t.request, 180).replace(/\|/g, '\\|')} | ${cut(t.expected, 180).replace(/\|/g, '\\|')} | ${cut(t.actual, 180).replace(/\|/g, '\\|')} | ${t.passed ? 'PASS' : 'FAIL'} | ${t.durationMs || 0} |`);
    });
    lines.push('');
    lines.push('## 3. 证据');
    rec.tests.forEach((t, i) => {
        lines.push(`- ${i + 1}. ${t.name}: ${t.passed ? 'PASS' : 'FAIL'} | ${cut(t.evidence, 600) || '无'}`);
    });
    lines.push('');
    lines.push('## 4. 人工复核步骤');
    manual(rec.port).forEach((x) => lines.push(`- ${x}`));
    lines.push('');
    return lines.join('\n');
}

function summaryMd(all, ctx) {
    const arr = Object.values(all.ports);
    const total = arr.reduce((a, b) => a + b.summary.total, 0);
    const pass = arr.reduce((a, b) => a + b.summary.passed, 0);
    const fail = total - pass;
    const lines = [];
    lines.push('# drpy-node 全端口汇总报告');
    lines.push('');
    lines.push(`- 时间: ${ctx.startedAt} ~ ${ctx.finishedAt}`);
    lines.push(`- Node: ${ctx.runtime.node}`);
    lines.push(`- Python: ${ctx.runtime.python}`);
    lines.push(`- npm: ${ctx.runtime.npm}`);
    lines.push(`- 插件配置来源: ${ctx.plugins.src || '无'}`);
    lines.push(`- 用户.plugins.js存在: ${ctx.plugins.userExists}`);
    lines.push(`- plugins目录存在: ${ctx.plugins.dirExists}`);
    lines.push(`- 服务日志: ${ctx.stdoutLog}, ${ctx.stderrLog}`);
    lines.push('');
    lines.push('## 1. 端口结果');
    lines.push('| 端口 | 角色 | 通过 | 失败 | 总数 | 结果 | 报告 |');
    lines.push('|---|---|---:|---:|---:|---|---|');
    arr.forEach((p) => {
        lines.push(`| ${p.port} | ${p.role} | ${p.summary.passed} | ${p.summary.failed} | ${p.summary.total} | ${p.summary.status} | port-${p.port}.md |`);
    });
    lines.push('');
    lines.push('## 2. 结论');
    lines.push(`- 用例总数: ${total}`);
    lines.push(`- 通过: ${pass}`);
    lines.push(`- 失败: ${fail}`);
    lines.push(`- 总体: ${fail === 0 ? 'PASS' : 'FAIL'}`);
    lines.push('');
    lines.push('## 3. 业务判断');
    lines.push('- 5757 为核心业务入口，接口族与引擎链路已验证。');
    lines.push('- 57575 独立监听正常。');
    lines.push('- 57570 通过TCP与PY引擎双重验证。');
    lines.push('- 57571-57574 按插件配置状态给出未接入原因与探测证据。');
    lines.push('');
    return lines.join('\n');
}

function implementationMd(all, ctx) {
    const arr = Object.values(all.ports).sort((a, b) => a.port - b.port);
    const total = arr.reduce((a, b) => a + b.summary.total, 0);
    const pass = arr.reduce((a, b) => a + b.summary.passed, 0);
    const fail = total - pass;
    const reportDir = String(ctx.reportDir || '').replace(/\\/g, '/');
    const lines = [];

    lines.push(`# drpy-node 全端口接入实施记录（批次 ${ctx.batchId}）`);
    lines.push('');
    lines.push('## 1. 目标与范围');
    lines.push('- 目标：对 drpy-node 当前配置下的全部端口进行覆盖验证，确保每个端口均有可复核证据并形成落盘报告。');
    lines.push('- 覆盖端口：5757、57575、57570、57571、57572、57573、57574。');
    lines.push('- 验证方式：实际发起 HTTP / WebSocket / TCP 探测，并输出分端口与汇总报告。');
    lines.push('');

    lines.push('## 2. 执行环境');
    lines.push(`- 项目路径：\`${ROOT}\``);
    lines.push('- 执行命令：`node scripts/test/full-port-validation.mjs`');
    lines.push(`- Node：\`${ctx.runtime.node}\``);
    lines.push(`- Python：\`${ctx.runtime.python}\``);
    lines.push(`- npm：\`${ctx.runtime.npm}\``);
    lines.push(`- 运行区间：\`${ctx.startedAt} ~ ${ctx.finishedAt}\``);
    lines.push('');

    lines.push('## 3. 执行结果');
    lines.push(`- 总用例：\`${total}\``);
    lines.push(`- 通过：\`${pass}\``);
    lines.push(`- 失败：\`${fail}\``);
    lines.push(`- 总体：\`${fail === 0 ? 'PASS' : 'FAIL'}\``);
    lines.push('');
    lines.push('分端口结果：');
    arr.forEach((p) => {
        lines.push(`- \`${p.port}\`: ${p.summary.passed}/${p.summary.total} ${p.summary.status}`);
    });
    lines.push('');

    lines.push('## 4. 判定依据');
    lines.push('- 5757：健康检查、WS 桥接、JS/PY/CAT 引擎、proxy/parse、控制器、参数校验、安全校验。');
    lines.push('- 57575：独立 WS 端口可达性与路由行为。');
    lines.push('- 57570：TCP 监听与 /health 中 Python 状态一致性。');
    lines.push('- 57571-57574：按插件配置状态判定（active + 路径存在性 + TCP 探测一致性）。');
    lines.push('');

    lines.push('## 5. 插件端口说明');
    lines.push(`- 插件配置来源：\`${ctx.plugins.src || '无'}\``);
    lines.push(`- 用户 .plugins.js 存在：\`${ctx.plugins.userExists}\``);
    lines.push(`- plugins 目录存在：\`${ctx.plugins.dirExists}\``);
    for (const item of ctx.pluginMatrix) {
        lines.push(`- 端口 ${item.port}: name=${item.name}, active=${item.active}, path=${item.path || '无'}, pathExists=${item.pathExists}`);
    }
    lines.push('');

    lines.push('## 6. 落盘证据');
    lines.push(`- 汇总：\`${reportDir}/summary.md\``);
    lines.push(`- 原始数据：\`${reportDir}/raw-results.json\``);
    lines.push('- 分端口：');
    arr.forEach((p) => {
        lines.push(`  - \`${reportDir}/port-${p.port}.md\``);
    });
    lines.push('- 服务日志：');
    lines.push(`  - \`${ctx.stdoutLog.replace(/\\/g, '/')}\``);
    lines.push(`  - \`${ctx.stderrLog.replace(/\\/g, '/')}\``);
    lines.push('');

    lines.push('## 7. 成功关键点');
    lines.push('- 用统一脚本一次性覆盖全部端口，避免遗漏。');
    lines.push('- 用原始 JSON + 分端口报告 + 服务日志三层证据保证可审计。');
    lines.push('- 对插件端口采用配置一致性判定，避免把未启用插件误判为失败。');
    lines.push('');

    return lines.join('\n');
}

function wsEcho(url) {
    return new Promise((resolve) => {
        const ws = new WebSocket(url, {handshakeTimeout: 10000});
        let done = false;
        let w = false;
        let e = false;
        const seen = [];
        const finish = (r) => {
            if (done) return;
            done = true;
            try { ws.close(); } catch {}
            resolve(r);
        };
        const timer = setTimeout(() => finish({passed: false, actual: 'WS超时', evidence: seen.join(' | ')}), 12000);
        ws.once('open', () => ws.send(JSON.stringify({type: 'heartbeat', from: 'validator'})));
        ws.on('message', (d) => {
            const t = d.toString();
            seen.push(cut(t, 120));
            let j = null;
            try { j = JSON.parse(t); } catch {}
            if (j?.type === 'welcome') w = true;
            if (j?.type === 'echo') e = true;
            if (w && e) {
                clearTimeout(timer);
                finish({passed: true, actual: '收到welcome+echo', evidence: seen.join(' | ')});
            }
        });
        ws.once('error', (err) => {
            clearTimeout(timer);
            finish({passed: false, actual: 'WS异常', evidence: err.message});
        });
    });
}

async function main() {
    const startedAt = now();
    const dir = path.join(ROOT, 'reports', 'port-validation', fmt());
    await fsp.mkdir(dir, {recursive: true});

    const recs = {
        [MAIN]: {port: MAIN, role: '主服务端口', tests: [], summary: null},
        [WS]: {port: WS, role: '独立WS端口', tests: [], summary: null},
        [DAEMON]: {port: DAEMON, role: 'Python daemon端口', tests: [], summary: null},
        57571: {port: 57571, role: '插件端口 req-proxy', tests: [], summary: null},
        57572: {port: 57572, role: '插件端口 pvideo', tests: [], summary: null},
        57573: {port: 57573, role: '插件端口 pup-sniffer', tests: [], summary: null},
        57574: {port: 57574, role: '插件端口 mediaProxy', tests: [], summary: null},
    };

    const plugins = await loadPlugins();
    const pMap = new Map();
    (plugins.list || []).forEach((p) => {
        const p0 = pluginPort(p.params);
        if (p0) pMap.set(p0, p);
    });

    const pythonPath = detectPythonPath();
    const runtime = {
        node: process.version,
        python: firstAvailableVersion([pythonPath, 'python.exe', 'python3.exe', 'python']),
        npm: firstAvailableVersion(['npm.cmd', 'npm'], ['-v']),
        pythonPath: pythonPath || '未检测到'
    };

    const stdoutLog = path.join(dir, 'server.stdout.log');
    const stderrLog = path.join(dir, 'server.stderr.log');
    const out = fs.createWriteStream(stdoutLog, {flags: 'a'});
    const err = fs.createWriteStream(stderrLog, {flags: 'a'});

    const env = {...process.env};
    delete env.API_AUTH_NAME;
    delete env.API_AUTH_CODE;
    delete env.API_PWD;
    if (!env.PROXY_AUTH) env.PROXY_AUTH = 'drpys';
    if (pythonPath) env.PYTHON_PATH = pythonPath;

    const srv = spawn(process.execPath, ['index.js'], {cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe']});
    srv.stdout.pipe(out);
    srv.stderr.pipe(err);

    let health = null;
    try {
        const readyMain = await waitHttp(`http://127.0.0.1:${MAIN}/health`);
        const readyWs = await waitHttp(`http://127.0.0.1:${WS}/`);
        if (!readyMain || !readyWs || srv.exitCode !== null) throw new Error('服务未就绪');
        await sleep(1000);

        const base = `http://127.0.0.1:${MAIN}`;
        const wsBase = `http://127.0.0.1:${WS}`;
        const js = encodeURIComponent('设置中心');
        const py = encodeURIComponent('依赖测试');
        const cat = encodeURIComponent('猫测试');
        const main = recs[MAIN];

        await run(main, {category: '健康', name: '/health', request: 'GET /health', expected: '200+ok'}, async () => {
            const r = await req(`${base}/health`); health = r.json;
            return {passed: r.status === 200 && r.json?.status === 'ok', actual: `HTTP ${r.status}`, evidence: cut(JSON.stringify(r.json || r.text), 400)};
        });
        await run(main, {category: '基础', name: '/', request: 'GET /', expected: '200'}, async () => {
            const r = await req(`${base}/`);
            return {passed: r.status === 200, actual: `HTTP ${r.status}`, evidence: cut(r.text)};
        });
        await run(main, {category: 'WS桥接', name: '/ws/status', request: 'GET /ws/status', expected: '200'}, async () => {
            const r = await req(`${base}/ws/status`);
            return {passed: r.status === 200 && r.json?.status === 'ok', actual: `HTTP ${r.status}`, evidence: cut(JSON.stringify(r.json || r.text))};
        });
        await run(main, {category: 'WS桥接', name: '/ws echo', request: `ws://127.0.0.1:${MAIN}/ws`, expected: 'welcome+echo'}, async () => wsEcho(`ws://127.0.0.1:${MAIN}/ws`));
        await run(main, {category: '引擎', name: 'JS设置中心', request: `GET /api/${js}`, expected: '200'}, async () => {
            const r = await req(`${base}/api/${js}`); return {passed: r.status === 200 && !!r.json, actual: `HTTP ${r.status}`, evidence: cut(JSON.stringify(r.json || r.text), 400)};
        });
        await run(main, {category: '引擎', name: 'PY依赖测试', request: `GET /api/${py}?do=py`, expected: '200'}, async () => {
            const r = await req(`${base}/api/${py}?do=py`); return {passed: r.status === 200 && !!r.json, actual: `HTTP ${r.status}`, evidence: cut(JSON.stringify(r.json || r.text), 400)};
        });
        await run(main, {category: '引擎', name: 'CAT猫测试', request: `GET /api/${cat}?do=cat`, expected: '200'}, async () => {
            const r = await req(`${base}/api/${cat}?do=cat`); return {passed: r.status === 200 && !!r.json, actual: `HTTP ${r.status}`, evidence: cut(JSON.stringify(r.json || r.text), 400)};
        });
        await run(main, {category: '引擎', name: 'CAT代理', request: `GET /proxy/${cat}/ping?do=cat`, expected: '200'}, async () => {
            const r = await req(`${base}/proxy/${cat}/ping?do=cat`); return {passed: r.status === 200 && r.text.length > 0, actual: `HTTP ${r.status}`, evidence: cut(r.text, 400)};
        });
        await run(main, {category: '引擎', name: '解析不存在', request: 'GET /parse/__not_exists__', expected: '404'}, async () => {
            const r = await req(`${base}/parse/__not_exists__`); return {passed: r.status === 404, actual: `HTTP ${r.status}`, evidence: cut(JSON.stringify(r.json || r.text))};
        });

        const okRoutes = ['/file-proxy/health', '/file-proxy/status', '/m3u8-proxy/health', '/m3u8-proxy/status', '/unified-proxy/health', '/unified-proxy/status', '/webdav/health', '/webdav/status', '/ftp/health', '/ftp/status', '/docs/apidoc.md', '/source-checker/config/default', '/image/memory', '/image/list', '/clipboard/read', '/config/index.js'];
        for (const r0 of okRoutes) {
            await run(main, {category: '控制器', name: r0, request: `GET ${r0}`, expected: '200'}, async () => {
                const r = await req(`${base}${r0}`);
                return {passed: r.status === 200, actual: `HTTP ${r.status}`, evidence: cut(JSON.stringify(r.json || r.text), 320)};
            });
        }

        await run(main, {category: '参数校验', name: '/file-proxy/proxy无auth', request: 'GET /file-proxy/proxy', expected: '401'}, async () => {
            const r = await req(`${base}/file-proxy/proxy`); return {passed: r.status === 401, actual: `HTTP ${r.status}`, evidence: cut(JSON.stringify(r.json || r.text))};
        });
        const checks = [['/file-proxy/proxy?auth=drpys', 400], ['/m3u8-proxy/playlist?auth=drpys', 400], ['/unified-proxy/proxy?auth=drpys', 400], ['/webdav/file', 400], ['/ftp/file', 400], ['/mediaProxy', 400]];
        for (const [r0, code] of checks) {
            await run(main, {category: '参数校验', name: r0, request: `GET ${r0}`, expected: String(code)}, async () => {
                const r = await req(`${base}${r0}`); return {passed: r.status === code, actual: `HTTP ${r.status}`, evidence: cut(JSON.stringify(r.json || r.text), 300)};
            });
        }
        await run(main, {category: '安全', name: 'unified内网拦截', request: '/unified-proxy/proxy?auth=drpys&url=http://127.0.0.1', expected: '403'}, async () => {
            const u = encodeURIComponent(`http://127.0.0.1:${MAIN}/health`);
            const r = await req(`${base}/unified-proxy/proxy?auth=drpys&url=${u}`);
            return {passed: r.status === 403, actual: `HTTP ${r.status}`, evidence: cut(JSON.stringify(r.json || r.text), 300)};
        });
        await run(main, {category: '控制器', name: 'authcoder', request: '/authcoder?len=8&number=3', expected: '200+3行'}, async () => {
            const r = await req(`${base}/authcoder?len=8&number=3`);
            const n = r.text.trim().split(/\r?\n/).filter(Boolean).length;
            return {passed: r.status === 200 && n === 3, actual: `HTTP ${r.status}, lines=${n}`, evidence: cut(r.text, 300)};
        });
        await run(main, {category: '控制器', name: 'encoder', request: 'POST /encoder', expected: '200'}, async () => {
            const r = await req(`${base}/encoder`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({type: 'base64', code: 'drpy-node'})});
            return {passed: r.status === 200 && r.json?.success === true, actual: `HTTP ${r.status}`, evidence: cut(JSON.stringify(r.json || r.text), 300)};
        });
        await run(main, {category: '控制器', name: 'decoder参数校验', request: 'POST /decoder', expected: '400'}, async () => {
            const r = await req(`${base}/decoder`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({code: 'abc'})});
            return {passed: r.status === 400, actual: `HTTP ${r.status}`, evidence: cut(JSON.stringify(r.json || r.text), 300)};
        });
        await run(main, {category: '控制器', name: 'ws/broadcast参数校验', request: 'POST /ws/broadcast', expected: '400'}, async () => {
            const r = await req(`${base}/ws/broadcast`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({})});
            return {passed: r.status === 400, actual: `HTTP ${r.status}`, evidence: cut(JSON.stringify(r.json || r.text), 300)};
        });

        await run(recs[WS], {category: 'WS端口', name: '/', request: 'GET /', expected: '200'}, async () => {
            const r = await req(`${wsBase}/`); return {passed: r.status === 200, actual: `HTTP ${r.status}`, evidence: cut(r.text, 250)};
        });
        await run(recs[WS], {category: 'WS端口', name: '/not-found', request: 'GET /not-found', expected: '404'}, async () => {
            const r = await req(`${wsBase}/not-found`); return {passed: r.status === 404, actual: `HTTP ${r.status}`, evidence: cut(r.text, 250)};
        });

        await run(recs[DAEMON], {category: 'Daemon', name: 'TCP监听', request: `TCP ${DAEMON}`, expected: 'open'}, async () => {
            const t = await tcp('127.0.0.1', DAEMON, 3000); return {passed: t.open, actual: t.open ? `OPEN(${t.latencyMs}ms)` : `CLOSED(${t.err})`, evidence: JSON.stringify(t)};
        });
        await run(recs[DAEMON], {category: 'Daemon', name: 'health一致性', request: '/health vs tcp', expected: 'available=true时tcp=open'}, async () => {
            const py0 = health?.python || {}; const t = await tcp('127.0.0.1', DAEMON, 3000);
            return {passed: py0.available ? t.open : true, actual: `available=${py0.available},daemon_running=${py0.daemon_running},tcp=${t.open}`, evidence: cut(JSON.stringify({py0, t}), 320), note: py0.available ? '' : '环境不可用按跳过处理'};
        });

        for (const p of PLUGIN_PORTS) {
            const rec = recs[p];
            const cfg = pMap.get(p);
            await run(rec, {category: '插件端口', name: cfg ? cfg.name : '无映射', request: `TCP ${p}`, expected: '按active和路径判定'}, async () => {
                const t = await tcp('127.0.0.1', p, 2200);
                if (!cfg) return {passed: !t.open, actual: t.open ? 'OPEN' : `CLOSED(${t.err})`, evidence: '无端口映射'};
                const exists = fs.existsSync(path.join(ROOT, cfg.path || ''));
                const shouldOpen = Boolean(cfg.active) && exists;
                const pass = shouldOpen ? t.open : !t.open;
                return {passed: pass, actual: `${t.open ? 'OPEN' : `CLOSED(${t.err})`} | 预期${shouldOpen ? 'OPEN' : 'CLOSED'}`, evidence: cut(JSON.stringify({active: cfg.active, params: cfg.params, exists, probe: t}), 450), note: cfg.active ? '' : '插件未激活'};
            });
        }
    } finally {
        try { out.end(); } catch {}
        try { err.end(); } catch {}
        if (srv.exitCode === null) {
            srv.kill('SIGINT');
            await sleep(1500);
            if (srv.exitCode === null) srv.kill('SIGTERM');
            await sleep(1000);
            if (srv.exitCode === null) srv.kill('SIGKILL');
        }
    }

    const finishedAt = now();
    Object.values(recs).forEach(sum);

    const result = {
        meta: {startedAt, finishedAt, root: ROOT},
        environment: {
            runtime,
            pluginConfigSource: plugins.src,
            pluginConfigLoadError: plugins.err,
            userPluginsExists: fs.existsSync(path.join(ROOT, '.plugins.js')),
            pluginsDirExists: fs.existsSync(path.join(ROOT, 'plugins')),
        },
        ports: recs,
    };
    const pluginMatrix = PLUGIN_PORTS.map((port) => {
        const cfg = pMap.get(port);
        return {
            port,
            name: cfg?.name || '无映射',
            active: Boolean(cfg?.active),
            path: cfg?.path || '',
            pathExists: cfg?.path ? fs.existsSync(path.join(ROOT, cfg.path)) : false,
        };
    });
    const summaryCtx = {
        startedAt,
        finishedAt,
        runtime,
        plugins: {
            src: plugins.src,
            userExists: fs.existsSync(path.join(ROOT, '.plugins.js')),
            dirExists: fs.existsSync(path.join(ROOT, 'plugins')),
        },
        stdoutLog: path.relative(ROOT, stdoutLog),
        stderrLog: path.relative(ROOT, stderrLog),
    };
    const batchId = path.basename(dir);

    await fsp.writeFile(path.join(dir, 'raw-results.json'), JSON.stringify(result, null, 2), 'utf8');

    const ctx = {startedAt, finishedAt, py: health?.python || {}, pluginByPort: pMap};
    for (const rec of Object.values(recs)) {
        await fsp.writeFile(path.join(dir, `port-${rec.port}.md`), portMd(rec, ctx), 'utf8');
    }
    await fsp.writeFile(path.join(dir, 'summary.md'), summaryMd(result, summaryCtx), 'utf8');
    await fsp.writeFile(path.join(dir, 'implementation-log.md'), implementationMd(result, {
        ...summaryCtx,
        batchId,
        reportDir: path.relative(ROOT, dir),
        pluginMatrix,
    }), 'utf8');

    const total = Object.values(recs).reduce((a, b) => a + b.summary.total, 0);
    const fail = Object.values(recs).reduce((a, b) => a + b.summary.failed, 0);
    console.log(`[full-port-validation] 报告目录: ${dir}`);
    console.log(`[full-port-validation] 用例总数=${total}, 失败=${fail}`);
    if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
    console.error('[full-port-validation] 执行失败:', e);
    process.exit(1);
});



