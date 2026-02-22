# drpy-node 全端口接入实施记录（批次 20260222-110522）

## 1. 目标与范围
- 目标：对 drpy-node 当前配置下的全部端口进行覆盖验证，确保每个端口均有可复核证据并形成落盘报告。
- 覆盖端口：5757、57575、57570、57571、57572、57573、57574。
- 验证方式：实际发起 HTTP / WebSocket / TCP 探测，并输出分端口与汇总报告。

## 2. 执行环境
- 项目路径：`D:\code\yingshi\drpy-node`
- 执行命令：`node scripts/test/full-port-validation.mjs`
- Node：`v24.9.0`
- Python：`Python 3.13.0`
- npm：`不可用`
- 运行区间：`2026-02-22T03:05:22.834Z ~ 2026-02-22T03:05:31.444Z`

## 3. 执行结果
- 总用例：`45`
- 通过：`45`
- 失败：`0`
- 总体：`PASS`

分端口结果：
- `5757`: 37/37 PASS
- `57570`: 2/2 PASS
- `57571`: 1/1 PASS
- `57572`: 1/1 PASS
- `57573`: 1/1 PASS
- `57574`: 1/1 PASS
- `57575`: 2/2 PASS

## 4. 判定依据
- 5757：健康检查、WS 桥接、JS/PY/CAT 引擎、proxy/parse、控制器、参数校验、安全校验。
- 57575：独立 WS 端口可达性与路由行为。
- 57570：TCP 监听与 /health 中 Python 状态一致性。
- 57571-57574：按插件配置状态判定（active + 路径存在性 + TCP 探测一致性）。

## 5. 插件端口说明
- 插件配置来源：`D:\code\yingshi\drpy-node\.plugins.example.js`
- 用户 .plugins.js 存在：`false`
- plugins 目录存在：`false`
- 端口 57571: name=req-proxy, active=false, path=plugins/req-proxy, pathExists=false
- 端口 57572: name=pvideo, active=false, path=plugins/pvideo, pathExists=false
- 端口 57573: name=pup-sniffer, active=false, path=plugins/pup-sniffer, pathExists=false
- 端口 57574: name=mediaProxy, active=false, path=plugins/mediaProxy, pathExists=false

## 6. 落盘证据
- 汇总：`reports/port-validation/20260222-110522/summary.md`
- 原始数据：`reports/port-validation/20260222-110522/raw-results.json`
- 分端口：
  - `reports/port-validation/20260222-110522/port-5757.md`
  - `reports/port-validation/20260222-110522/port-57570.md`
  - `reports/port-validation/20260222-110522/port-57571.md`
  - `reports/port-validation/20260222-110522/port-57572.md`
  - `reports/port-validation/20260222-110522/port-57573.md`
  - `reports/port-validation/20260222-110522/port-57574.md`
  - `reports/port-validation/20260222-110522/port-57575.md`
- 服务日志：
  - `reports/port-validation/20260222-110522/server.stdout.log`
  - `reports/port-validation/20260222-110522/server.stderr.log`

## 7. 成功关键点
- 用统一脚本一次性覆盖全部端口，避免遗漏。
- 用原始 JSON + 分端口报告 + 服务日志三层证据保证可审计。
- 对插件端口采用配置一致性判定，避免把未启用插件误判为失败。
