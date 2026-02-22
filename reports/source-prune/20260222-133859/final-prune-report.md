# 失效源复测与下线执行报告（正式）

## 1. 目标
- 对 `source-checker` 失败源做二次复测。
- 仅对“确认源站失效”的源执行下线（从配置中移除）。

## 2. 执行批次
- 初始失败报告：`reports/source-checker-batch/20260222-115201/report.json`
- 第一轮复测下线：`reports/source-prune/20260222-133215`
- 第一轮后全量回归：`reports/source-checker-batch/20260222-133310`
- 第二轮复测下线：`reports/source-prune/20260222-133612`
- 第二轮后全量回归：`reports/source-checker-batch/20260222-133629`
- 残余错误复核：`reports/source-prune/20260222-133859`

## 3. 下线结果
- 初始错误：`68`
- 第一轮确认失效并下线：`63`
- 第二轮确认失效并下线：`3`
- 总计下线：`66`
- 下线清单文件：`data/source-checker/disabled-sources.json`

## 4. 当前全量状态（下线后）
- 总源数：`276`（由 `342` 降到 `276`）
- 成功：`260`
- 失败：`2`
- 待人工：`14`
- 结果文件：`reports/source-checker-batch/20260222-133629/report.json`

## 5. 剩余 2 个错误源（未删除原因）
- `hipy_py_五八[AG¹]`：`resource check failed: api=true extAny=false`
- `hipy_py_紫云[AV¹]`：`resource check failed: api=true extAny=false`
- 复测结论：属于 `recovered_or_unstable`，API 可达但 ext 资源不稳定，未达到“确认失效”标准，因此未自动删除。

## 6. 实施机制
- 新增复测下线脚本：`scripts/test/source-prune-invalid.mjs`
- 配置层下线过滤：`controllers/config.js`
- 开关：`enable_disabled_source_filter`（默认 `1`）
- 行为：`disabled-sources.json` 中的 key 将在生成配置时自动剔除。

## 7. 结论
- 已完成“确认失效即删除”的自动化闭环，删除动作有复测证据和落盘记录。
- 对未达到确认失效标准的源，保持谨慎，不做误删。
