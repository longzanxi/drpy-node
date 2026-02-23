# 失败源修复深度报告（2026-02-23）

## 1. 目标与结论
- 目标：把此前失败的 `ysxq / kanbot / libvio` 从“严格验证失败”修复到“严格验证通过”，并给出可复验证据。
- 结论：已完成代码修复并通过严格并发验证。
  - 全量 11 源（含不稳定源）：`11/11 success`，`requiredPassed=319/319`。
  - 默认启用集（不含 libvio）：`10/10 success`，`requiredPassed=290/290`。

## 2. 原始失败根因（深度分析）

### 2.1 根因A：固定入口导致源老化
- `ysxq` 之前固定 `id=116295/sid=1/nid=1`；`kanbot` 之前固定 `play/962794`。
- 这会长期命中历史线路，导致返回的播放地址过期或失效，严格探测出现 `403/404`。

### 2.2 根因B：阻塞式提取导致“连带超时”
- `ctf-local-adapter` 使用 `spawnSync` 调本地脚本；当单站脚本耗时过长时，会阻塞 Node 事件循环。
- 在严格并发压测中，出现“本来可用的站（如 bgm）也超时”的连带失败。
- 证据批次：`reports/ctf-local-adapter-strict-validation/20260223-115504`（`8/11`，含 `home.default.code` abort）。

### 2.3 根因C：libvio 的反爬与签名时效
- `libvio` 存在源站防护和签名 URL 时效问题。
- 盲目全量深扫会拉长请求时长，且不稳定；需要“快路径 + 缓存复用 + 可选深扫”。

## 3. 本次修复改造

### 3.1 内置脚本资产补齐（避免外部依赖缺失）
- 新增到内置工作区：
  - `external/workspace-sources/播剧影视/main/extract-play-source.js`
  - `external/workspace-sources/播剧影视/main/ast_env.js`
  - `external/workspace-sources/kanbot.com/main/ikanbot_keygen.js`
  - `external/workspace-sources/kanbot.com/main/ast_env.js`
- 新增 CommonJS 目录声明：
  - `external/workspace-sources/播剧影视/main/package.json`
  - `external/workspace-sources/kanbot.com/main/package.json`
  - `external/workspace-sources/libvio/package.json`
- 依赖补齐：`package.json` 新增 `esprima`（并更新 `package-lock.json`）。

### 3.2 适配器主逻辑改造
- 修改文件：`controllers/ctf-local-adapter.js`
- 核心变更：
  - `ysxq`：新增“实时发现 `vodplay` + 本地脚本提取”主链，worker/快照退为兜底。
  - `kanbot`：新增“实时发现 `/play/<id>` + 动态 worker 请求”主链，避免固定旧视频 ID。
  - `libvio`：新增“发布页域名发现 + 多 play 候选”；默认优先 `last_good_cache` 快路径，深扫改为可选开关，防止阻塞连带超时。
  - 新增通用工具：`fetchTextWithTimeoutNoThrow`、路径链接发现、字幕归一化等。

### 3.3 默认启用策略调整
- `DEFAULT_DISABLED_SITE_IDS` 从 `['ysxq','kanbot','libvio']` 调整为 `['libvio']`。
- 含义：`ysxq/kanbot` 已修复并默认启用；`libvio` 仍建议默认关闭（防护与签名时效波动）。

## 4. 严格实测（非虚构）

### 4.1 失败基线（修复前）
- 命令：`CTF_LOCAL_INCLUDE_UNSTABLE=1 node scripts/test/ctf-local-adapter-strict-validation.mjs --port=5757 --concurrency=4 --timeout=70000 --pwd=dzyyds`
- 报告：`reports/ctf-local-adapter-strict-validation/20260223-115504`
- 结果：`total=11, success=8, error=3, requiredPassed=302/319`

### 4.2 修复后全量 11 源
- 命令：同上（含 `CTF_LOCAL_INCLUDE_UNSTABLE=1`）
- 报告：
  - `reports/ctf-local-adapter-strict-validation/20260223-120348`
  - `reports/ctf-local-adapter-strict-validation/20260223-120601`
- 结果：两次均 `total=11, success=11, error=0, requiredPassed=319/319`

### 4.3 修复后默认启用集
- 命令：不设置 `CTF_LOCAL_INCLUDE_UNSTABLE`
- 报告：`reports/ctf-local-adapter-strict-validation/20260223-120654`
- 结果：`total=10, success=10, error=0, requiredPassed=290/290`

## 5. 三个历史失败源的通过证据
- 证据源：`reports/ctf-local-adapter-strict-validation/20260223-120601/raw-results.json`

### 5.1 ysxq
- `status=success`, `required=29/29`
- `play.url.probe`: `status=200`, `content-type=application/vnd.apple.mpegurl`

### 5.2 kanbot
- `status=success`, `required=29/29`
- `play.url.probe`: `status=200`, `content-type=application/vnd.apple.mpegurl`

### 5.3 libvio
- `status=success`, `required=29/29`
- `play.url.probe`: `status=200`, `stream_signature_matched`
- 说明：当前通过依赖可用缓存链路（`last_good_cache` 快路径）。

## 6. 运行建议与边界
- 若你要强制全开 11 源：
  - `CTF_LOCAL_INCLUDE_UNSTABLE=1`
- 若你要尝试 libvio 深扫刷新（可能更慢）：
  - `CTF_LOCAL_LIBVIO_ENABLE_SCAN=1`
  - `CTF_LOCAL_LIBVIO_REFRESH=1`
- 建议生产默认保持 `libvio` 关闭，定时人工复验后再开；`ysxq/kanbot` 已可默认启用。

## 7. 本次改动文件清单
- `controllers/ctf-local-adapter.js`
- `package.json`
- `package-lock.json`
- `external/workspace-sources/播剧影视/main/ast_env.js`
- `external/workspace-sources/播剧影视/main/extract-play-source.js`
- `external/workspace-sources/播剧影视/main/package.json`
- `external/workspace-sources/kanbot.com/main/ast_env.js`
- `external/workspace-sources/kanbot.com/main/ikanbot_keygen.js`
- `external/workspace-sources/kanbot.com/main/package.json`
- `external/workspace-sources/libvio/package.json`
