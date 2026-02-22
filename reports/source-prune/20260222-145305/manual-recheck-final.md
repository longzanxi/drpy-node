# 人工复验续篇报告（2026-02-22）

## 1. 目标
- 继续对剩余异常源进行人工复验。
- 识别真实失败原因，确认“源站失效”后执行下线。
- 复验后做一次全量回归并落盘。

## 2. 本次修复（阻断项）
- 文件：`utils/daemonManager.js`
- 问题：Windows 环境下 Python 解释器检测与拉起不稳定，导致人工复验前置条件（57570 daemon）偶发未就绪。
- 修复：
  - `isPythonAvailable()` 改为 `execFile(..., ['--version'])`，同时识别 `stdout/stderr`。
  - `getPythonPath()` 增加 Windows `LOCALAPPDATA/Programs/Python/*/python.exe` 真实解释器优先解析；VENV 下改为 `Scripts/python.exe`。
  - 保留 `exec` 供 `stopDaemon()` 使用，避免回归。
- 结果：人工复验脚本可稳定拉起服务与 daemon。

## 3. 人工复验执行记录（剩余 2 源）
- 执行脚本：`scripts/test/manual-recheck-remaining-sources.mjs --timeout=60000`
- 批次：
  - `reports/manual-recheck/20260222-144034/raw-results.json`
  - `reports/manual-recheck/20260222-144133/raw-results.json`
  - `reports/manual-recheck/20260222-144143/raw-results.json`
  - `reports/manual-recheck/20260222-145228/raw-results.json`

### 3.1 复验结论（稳定复现）
- `hipy_py_五八[AG¹]`：连续多轮 **search 步骤失败**（HTTP 500），home/list/detail/play_probe 可过。
- `hipy_py_紫云[AV¹]`：连续多轮 **全步骤通过**（home/list/search/detail/play/play_probe）。

## 4. 失败根因分析（五八）
- 日志证据：
  - `reports/manual-recheck/20260222-144143/runtime.stderr.log`
- 栈信息关键点：
  - `spider/py/AppGet.py:164 searchContent -> self.getdata('/searchList', body)`
  - `spider/py/AppGet.py:305 vdata.json()['data']` 触发 `JSONDecodeError`
- 结论：上游搜索接口返回非 JSON，导致搜索能力不可用；该失败已跨批次稳定复现，不是单次网络抖动。

## 5. 下线动作
- 依据：满足“确认失败后下线”。
- 操作：将 `hipy_py_五八[AG¹]` 写入禁用清单。
- 文件：`data/source-checker/disabled-sources.json`
- 变更：`keys` 从 66 增至 67，并追加 `history` 记录。

## 6. 全量回归（下线后）
- 执行：`node scripts/test/full-source-checker.mjs --concurrency=8 --timeout=60000`
- 报告：`reports/source-checker-batch/20260222-145305/report.json`
- 汇总：
  - total=275
  - success=260
  - error=1
  - pending=14

### 6.1 剩余 1 个 error
- `hipy_py_紫云[AV¹]`：`resource check failed: api=true extAny=false`
- 解释：该错误来自 `full-source-checker` 的资源探测策略；与人工功能复验结论冲突（人工复验已通过搜索/分页/详情/播放链路）。
- 处置：**暂不删除**，避免误删可用源。

## 7. 业务结论
- 本次“继续人工复验”已完成，且对可确认失败源（五八）已执行下线。
- 当前 active 源中仍有 1 条自动化误报风格错误（紫云），人工验证为可用；建议后续优化 `full-source-checker` 对该类 hipy/ext 源的判定逻辑。
