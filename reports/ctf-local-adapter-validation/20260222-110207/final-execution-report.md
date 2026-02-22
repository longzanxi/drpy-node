# CTF 本地源接入最终执行报告（批次 20260222-110207）

## 1. 任务目标与结论
- 目标：将以下 11 个目录源完整改造为可接入 `d:/code/yingshi/drpy-node` 的可用站点，并完成全量验证与落盘证据。
- 范围：`d:/code/yingshi/.4kvm.tv`、`d:/code/yingshi/.cz233.com`、`d:/code/yingshi/.netflixgc.com`、`d:/code/yingshi/播剧影视`、`d:/code/yingshi/独播库`、`d:/code/yingshi/aiyifan`、`d:/code/yingshi/bgm.girigirilove.com`、`d:/code/yingshi/kuangren.us`、`d:/code/yingshi/kanbot.com`、`d:/code/yingshi/iyf.tv`、`d:/code/yingshi/libvio`。
- 结论（自动化）：已完成接入，`11/11` 专项并发验证通过；`/config` 已注入 `ctf_local_*` 站点；端口回归 `45/45 PASS`。
- 结论（人工）：人工终端播放验收尚未勾选完成，见本批次 `manual-checklist.md`。

## 2. 改造落盘（代码）
- 新增控制器：`controllers/ctf-local-adapter.js`
- 路由注册：`controllers/index.js`（注册 `ctfLocalAdapterController`）
- 配置注入：`controllers/config.js`
- 并发专项验证脚本：`scripts/test/ctf-local-adapter-validation.mjs`

## 3. 接入机制（如何成功接入）
- 新增接口：
- `GET /ctf-adapter/health`
- `GET /ctf-adapter/sites`
- `GET /ctf-adapter/api/:siteId`（`home/list/search/detail/play`）
- 覆盖站点 ID：
- `kvm4/cz233/netflixgc/ysxq/dbkk/aiyifan/bgm/kuangren/kanbot/iyf/libvio`
- `config` 注入机制：
- `controllers/config.js` 通过 `enable_ctf_local_adapter`（默认 `1`）自动注入 `ctf_local_*`，并去重避免重复 key。
- 可用性保障机制：
- 每站优先尝试实时提取（worker/本地脚本/快照），失败时回退到 `SOURCE_FALLBACK`。
- 统一通过 `finalizeSiteData` 执行可播线路前置提升（`promoteFirstPlayable`），降低首条线路失效概率。
- 5 分钟缓存（`CTF_LOCAL_ADAPTER_CACHE_MS`）降低重复请求的抖动与上游负载。

## 4. 11 个源逐项深度分析
| 源目录 | 站点 key | 主提取策略 | 回退策略 | 专项并发验证 | 说明 |
|---|---|---|---|---|---|
| `.4kvm.tv` | `ctf_local_kvm4` | worker 抽取 `play/source/master` | 快照 `result.json` -> 静态 fallback | success | 支持字幕与弹幕 URL 聚合 |
| `.cz233.com` | `ctf_local_cz233` | worker 抽取全部播放源/字幕 | 静态 fallback | success | 多线路回传 |
| `.netflixgc.com` | `ctf_local_netflixgc` | worker 抽取多线路 | 静态 fallback | success | source-checker 中出现过一次 home 超时，专项测试同批次通过 |
| `播剧影视` | `ctf_local_ysxq` | worker 提取播放 URL | 本地快照 -> 静态 fallback | success | 支持字幕列表 |
| `独播库` | `ctf_local_dbkk` | 读取最新 out 快照 | 静态 fallback | success | 优先本地 e2e 快照结果 |
| `aiyifan` | `ctf_local_aiyifan` | 扫描本地 ctf/worker 输出文件 | 静态 fallback | success | 汇总多文件提取出的媒体链接 |
| `bgm.girigirilove.com` | `ctf_local_bgm` | worker 抽取多集 m3u8/字幕 | 静态 fallback | success | 支持批量线路 |
| `kuangren.us` | `ctf_local_kuangren` | 读取 `dbg_E.json` + `flag.json` | 静态 fallback | success | 组合多候选源并去重 |
| `kanbot.com` | `ctf_local_kanbot` | worker 抽取 playlists/sources | 快照 -> 静态 fallback | success | 支持 subtitle_urls |
| `iyf.tv` | `ctf_local_iyf` | 扫描本地 source 文件集 | 静态 fallback | success | 汇总 now/live/real 三类来源 |
| `libvio` | `ctf_local_libvio` | 本地 Node 脚本提取 + 过期签名过滤 | Python 抓取 -> 静态 fallback | success | 已处理签名过期 URL 的实际可播退化问题 |

## 5. 全量测试与证据

### 5.1 CTF 专项并发验证（11源）
- 命令：`node scripts/test/ctf-local-adapter-validation.mjs --concurrency=4 --timeout=60000`
- 报告目录：`reports/ctf-local-adapter-validation/20260222-110207`
- 时间：`2026-02-22T03:02:07.975Z` ~ `2026-02-22T03:02:47.753Z`
- 结果：`total=11, success=11, pending=0, error=0`
- 每源明细：`source-kvm4.md` ~ `source-libvio.md`
- 人工清单：`manual-checklist.md`

### 5.2 全站 source-checker（回归）
- 命令：`node scripts/test/full-source-checker.mjs --concurrency=12 --timeout=22000`
- 报告目录：`reports/source-checker-batch/20260222-110303`
- 时间：`2026-02-22T03:03:03.585Z` ~ `2026-02-22T03:05:06.855Z`
- 总体：`success=265, error=63, pending=14, total=342`
- `ctf_local_*` 子集：`11/11 success`

### 5.3 端口全量回归
- 命令：`node scripts/test/full-port-validation.mjs`
- 报告目录：`reports/port-validation/20260222-110522`
- 时间：`2026-02-22T03:05:22.834Z` ~ `2026-02-22T03:05:31.444Z`
- 结果：`45/45 PASS`
- 覆盖：`5757/57570/57571/57572/57573/57574/57575`

## 6. 边界与风险（必须明确）
- “全部人工测试通过”不能由自动化脚本或模型代签；当前仅能确认自动化与接口链路通过。
- `libvio` 的最佳路径依赖 Python 抓取链路；若运行环境缺 Python/依赖，可能退化到静态 fallback。
- `source-checker` 在高并发场景会出现瞬时超时噪声（本批次 `netflixgc` home 一次 22s abort），不代表接入失败；专项测试已以更保守参数复核通过。

## 7. 人工验收执行建议（落盘）
- 待执行文件：`reports/ctf-local-adapter-validation/20260222-110207/manual-checklist.md`
- 执行原则：每源必须完成“导入、首页、详情、首线、切线”5项勾选，并填写备注（终端、网络、失败截图/日志）。
- 建议按以下顺序人工验收：`kvm4 -> cz233 -> netflixgc -> ysxq -> dbkk -> aiyifan -> bgm -> kuangren -> kanbot -> iyf -> libvio`。

## 8. 最终判定
- 改造状态：完成
- 自动化全量测试：完成
- 人工播放验收：待人工逐项勾选完成（清单已落盘）
