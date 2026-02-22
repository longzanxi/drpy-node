# drpy-node 全端口接入实施记录（批次 20260222-012641）

## 1. 目标与范围
- 目标：对 `drpy-node` 当前配置下的全部端口进行覆盖验证，确保每个端口均有可复核证据并形成落盘报告。
- 覆盖端口：`5757`、`57575`、`57570`、`57571`、`57572`、`57573`、`57574`。
- 验证方式：实际发起 HTTP / WebSocket / TCP 探测，并输出分端口与汇总报告。

## 2. 执行环境
- 项目路径：`D:\code\yingshi\drpy-node`
- 执行命令：`node scripts/test/full-port-validation.mjs`
- 运行区间：`2026-02-21T17:26:41.521Z ~ 2026-02-21T17:26:49.237Z`

## 3. 执行结果
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

## 4. 判定依据
- 5757：健康检查、WS 桥接、JS/PY/CAT 引擎、proxy/parse、控制器、参数校验、安全校验均通过。
- 57575：独立 WS 端口可达，基础路由行为正确。
- 57570：TCP 监听与 `/health` 的 python 状态一致。
- 57571-57574：按插件配置状态判定（active + 路径存在性 + TCP 探测一致性）。

## 5. 插件端口说明
- 配置来源：`.plugins.example.js`
- 当前状态：插件均 `active:false`，且无 `plugins/` 目录。
- 结论：插件端口预期不监听；实测均为关闭且与配置一致，判定通过。

## 6. 落盘证据
- 汇总：`reports/port-validation/20260222-012641/summary.md`
- 原始数据：`reports/port-validation/20260222-012641/raw-results.json`
- 分端口：
  - `reports/port-validation/20260222-012641/port-5757.md`
  - `reports/port-validation/20260222-012641/port-57570.md`
  - `reports/port-validation/20260222-012641/port-57571.md`
  - `reports/port-validation/20260222-012641/port-57572.md`
  - `reports/port-validation/20260222-012641/port-57573.md`
  - `reports/port-validation/20260222-012641/port-57574.md`
  - `reports/port-validation/20260222-012641/port-57575.md`
- 服务日志：
  - `reports/port-validation/20260222-012641/server.stdout.log`
  - `reports/port-validation/20260222-012641/server.stderr.log`

## 7. 成功关键点
- 采用统一脚本做全端口覆盖，避免人工漏测。
- 用原始 JSON + 分端口报告 + 服务日志三层证据，保证可审计、可复核。
- 对插件端口采用“配置一致性”判定，避免把未启用插件误判为失败。
