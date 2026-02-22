# CTF 本地源严格测试最终报告（批次 20260222-113115）

## 1. 测试目标
- 对以下 11 个源执行严格自动化校验：搜索、分页、详情、播放、首链路可播探测。
- 目标源：`.4kvm.tv/.cz233.com/.netflixgc.com/播剧影视/独播库/aiyifan/bgm.girigirilove.com/kuangren.us/kanbot.com/iyf.tv/libvio`。

## 2. 严格测试结果
- 批次：`20260222-113115`
- 时间：`2026-02-22T03:31:15.882Z` ~ `2026-02-22T03:32:10.401Z`
- 总源数：`11`
- success：`11`
- error：`0`
- 必选断言通过：`319/319`

## 3. 严格断言范围
- `home` 默认入口返回结构校验。
- `ac=home` 与默认入口一致性校验。
- `ac=list` 的 `pg=1,limit=1` 元数据与结果校验。
- `ac=list` 的 `pg=999` 页码夹逼行为校验。
- `ac=search` 正向命中与负向空结果校验。
- `ac=detail` 正向命中与负向空结果校验。
- `ac=videolist` 别名行为校验。
- `ac=play` 的 `code/parse/url` 语义校验。
- `play.url` 首链路实际探测校验。

## 4. 稳定性复核
- 首轮严格批次 `20260222-112844` 曾出现 `libvio` 首链路签名失效（HTTP 403）导致 1 项失败。
- 二轮批次 `20260222-113115` 已全量通过，说明该问题属于动态签名时效波动而非固定代码故障。

## 5. 交叉回归
- 全站回归（保守参数）：`reports/source-checker-batch/20260222-113726`
- 结果：`success=265, error=63, pending=14, total=342`
- 其中 `ctf_local_*`：`11/11 success`
- 端口回归：`reports/port-validation/20260222-113611`
- 结果：`45/45 PASS`

## 6. 落盘产物
- 严格汇总：`reports/ctf-local-adapter-strict-validation/20260222-113115/summary.md`
- 严格原始：`reports/ctf-local-adapter-strict-validation/20260222-113115/raw-results.json`
- 逐源明细：`reports/ctf-local-adapter-strict-validation/20260222-113115/source-*.md`
- 人工清单：`reports/ctf-local-adapter-strict-validation/20260222-113115/manual-checklist.md`

## 7. 人工测试边界
- 自动严格测试通过不等于人工播放器终验通过。
- 人工终验必须按 `manual-checklist.md` 逐源勾选“导入/搜索/分页/详情/播放/切线”。
