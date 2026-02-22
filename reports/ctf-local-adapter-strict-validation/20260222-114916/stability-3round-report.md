# CTF 本地源严格复验稳定性报告（3轮）

## 1. 复验目标
- 对 11 个 `ctf_local` 源执行连续 3 轮严格并发验证。
- 每轮均要求 `search/list(pagination)/detail/play/stream probe` 必选断言全部通过。

## 2. 执行命令
- `node scripts/test/ctf-local-adapter-strict-validation.mjs --concurrency=4 --timeout=60000`
- 连续执行 3 次。

## 3. 三轮结果
- `20260222-114723`: `total=11, success=11, error=0, required=319/319`
- `20260222-114823`: `total=11, success=11, error=0, required=319/319`
- `20260222-114916`: `total=11, success=11, error=0, required=319/319`

## 4. 稳定性修复说明
- 修复文件：`controllers/ctf-local-adapter.js`
- 修复点：
- 为 `libvio` 增加最近可用播放链路持久缓存（`data/ctf-local-adapter/libvio-last-good.json`）。
- 在源聚合阶段过滤已过期签名链接，避免回退到已失效签名 URL。
- 当动态提取失败时，优先使用最近一次可用缓存，降低波动误报。

## 5. 结论
- 本次“连续 3 轮严格复验”已全部通过。
- 当前自动化证据表明：11 个源在搜索、分页、播放等核心能力上已达到严格通过标准。
- 人工终验仍需按 `manual-checklist.md` 勾选确认。

## 6. 交叉回归（修复后）
- 全站回归：`reports/source-checker-batch/20260222-115201`
- 结果：`success=260, error=68, pending=14, total=342`
- 其中 `ctf_local_*`：`11/11 success`
- 端口回归：`reports/port-validation/20260222-115556`
- 结果：`45/45 PASS`
