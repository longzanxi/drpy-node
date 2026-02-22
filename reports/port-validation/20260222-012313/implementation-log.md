# drpy-node 全端口接入实施记录（批次 20260222-012313）

## 1. 目标与范围
- 目标：对 `drpy-node` 当前配置下的全部端口进行覆盖验证，确保每个端口均有可复核证据并形成落盘报告。
- 覆盖端口：
  - 主服务端口：`5757`
  - 独立 WS 端口：`57575`
  - Python daemon 端口：`57570`
  - 插件端口：`57571`、`57572`、`57573`、`57574`
- 验证方式：
  - 实际发起 HTTP / WebSocket / TCP 探测
  - 对每个端口输出独立报告
  - 汇总与原始结果 JSON 同步落盘

## 2. 执行环境
- 项目路径：`D:\code\yingshi\drpy-node`
- Node：`v24.9.0`
- Python：`Python 3.13.0`
- 运行时间：`2026-02-21T17:23:13.842Z ~ 2026-02-21T17:23:21.597Z`

## 3. 执行命令
```powershell
cd D:\code\yingshi\drpy-node
node scripts/test/full-port-validation.mjs
```

执行输出：
```text
[full-port-validation] 报告目录: D:\code\yingshi\drpy-node\reports\port-validation\20260222-012313
[full-port-validation] 用例总数=45, 失败=0
```

## 4. 通过判定标准
- 5757：核心接口族验证（健康、WS 桥接、JS/PY/CAT 引擎、proxy/parse、控制器、参数校验、安全校验）。
- 57575：独立 WS 服务可达性与路由行为验证。
- 57570：TCP 监听 + `/health` 中 python 状态一致性双验证。
- 57571-57574：按插件配置状态判定（`active` + 插件路径存在性 + TCP 探测结果一致）。

## 5. 结果总览
- 总用例：`45`
- 通过：`45`
- 失败：`0`
- 总体：`PASS`

分端口结果：
- `5757`: 37/37 PASS
- `57575`: 2/2 PASS
- `57570`: 2/2 PASS
- `57571`: 1/1 PASS
- `57572`: 1/1 PASS
- `57573`: 1/1 PASS
- `57574`: 1/1 PASS

## 6. 插件端口判定说明
- 配置来源：`.plugins.example.js`
- 当前状态：`req-proxy/pvideo/pup-sniffer/mediaProxy` 均为 `active: false`，且当前项目下不存在 `plugins/` 目录。
- 因此本批次对 57571-57574 的“通过”定义为：端口不应监听且 TCP 探测返回关闭（与配置一致）。

## 7. 证据落盘清单
- 汇总：`reports/port-validation/20260222-012313/summary.md`
- 原始数据：`reports/port-validation/20260222-012313/raw-results.json`
- 分端口报告：
  - `reports/port-validation/20260222-012313/port-5757.md`
  - `reports/port-validation/20260222-012313/port-57570.md`
  - `reports/port-validation/20260222-012313/port-57571.md`
  - `reports/port-validation/20260222-012313/port-57572.md`
  - `reports/port-validation/20260222-012313/port-57573.md`
  - `reports/port-validation/20260222-012313/port-57574.md`
  - `reports/port-validation/20260222-012313/port-57575.md`
- 服务日志：
  - `reports/port-validation/20260222-012313/server.stdout.log`
  - `reports/port-validation/20260222-012313/server.stderr.log`

## 8. 结论
- 在当前项目配置边界内，已完成全端口覆盖验证并全部通过。
- 所有端口均具备可追溯落盘证据，满足复核与审计需求。
