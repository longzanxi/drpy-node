# CTF 本地适配接入最终执行报告（批次 20260222-102822）

## 1. 目标与范围
- 目标：将指定 11 个目录源改造为可直接接入 `drpy-node` 的原生接口源。
- 范围：`.4kvm.tv/.cz233.com/.netflixgc.com/播剧影视/独播库/aiyifan/bgm.girigirilove.com/kuangren.us/kanbot.com/iyf.tv/libvio`。
- 要求：完整接入、并发测试、逐源落盘、可人工复核。

## 2. 代码改造落盘
- 新增控制器：`controllers/ctf-local-adapter.js`
- 路由注册：`controllers/index.js`（注册 `ctfLocalAdapterController`）
- 配置注入：`controllers/config.js`（新增 `ctf_local_*` 站点注入，开关 `enable_ctf_local_adapter`，默认 `1`）
- 新增并发验证脚本：`scripts/test/ctf-local-adapter-validation.mjs`

## 3. 接入协议
- `GET /ctf-adapter/health`
- `GET /ctf-adapter/sites`
- `GET /ctf-adapter/api/:siteId`
- `:siteId` 覆盖：`kvm4/cz233/netflixgc/ysxq/dbkk/aiyifan/bgm/kuangren/kanbot/iyf/libvio`
- `api/:siteId` 返回 maccms 风格的 `home/list/search/detail/play`

## 4. 测试批次与结果
- CTF 专项并发验证：`reports/ctf-local-adapter-validation/20260222-102822`
- 结果：`total=11, success=9, pending=2, error=0`
- 全站 source-checker 回归：`reports/source-checker-batch/20260222-102525`
- 结果：`total=342, success=264, pending=14, error=64`
- ctf_local 专项（从 source-checker 抽取）：`11/11 success`
- 端口回归：`reports/port-validation/20260222-102759`
- 结果：`45/45 PASS`

## 5. 逐源状态（双通道）
| id | key | CTF专项 | 播放探测 | source-checker |
|---|---|---|---|---|
| kvm4 | ctf_local_kvm4 | success | ok | success |
| cz233 | ctf_local_cz233 | success | ok | success |
| netflixgc | ctf_local_netflixgc | success | ok | success |
| ysxq | ctf_local_ysxq | success | ok | success |
| dbkk | ctf_local_dbkk | success | ok | success |
| aiyifan | ctf_local_aiyifan | success | ok | success |
| bgm | ctf_local_bgm | success | ok | success |
| kuangren | ctf_local_kuangren | pending | fetch failed | success |
| kanbot | ctf_local_kanbot | success | ok | success |
| iyf | ctf_local_iyf | success | ok | success |
| libvio | ctf_local_libvio | pending | HTTP 403 | success |

## 6. 人工复核结论与边界
- 本批次已完成“接入代码级验证 + 并发接口验证 + 全站回归 + 端口回归”。
- `pending` 项属于远端直链播放性边界，不是接口接入失败：
- `kuangren`：直链拉流阶段出现网络抓取失败（接口链路正常）。
- `libvio`：当前回退直链签名过期导致 `403`（接口链路正常）。
- 人工终验清单：`reports/ctf-local-adapter-validation/20260222-102822/manual-checklist.md`

## 7. 关键证据文件
- `reports/ctf-local-adapter-validation/20260222-102822/summary.md`
- `reports/ctf-local-adapter-validation/20260222-102822/manual-checklist.md`
- `reports/ctf-local-adapter-validation/20260222-102822/raw-results.json`
- `reports/source-checker-batch/20260222-102525/summary.md`
- `reports/source-checker-batch/20260222-102525/report.json`
- `reports/port-validation/20260222-102759/summary.md`
- `reports/port-validation/20260222-102759/raw-results.json`

