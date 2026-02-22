# drpy-node 全端口汇总报告

- 时间: 2026-02-22T03:05:22.834Z ~ 2026-02-22T03:05:31.444Z
- Node: v24.9.0
- Python: Python 3.13.0
- npm: 不可用
- 插件配置来源: D:\code\yingshi\drpy-node\.plugins.example.js
- 用户.plugins.js存在: false
- plugins目录存在: false
- 服务日志: reports\port-validation\20260222-110522\server.stdout.log, reports\port-validation\20260222-110522\server.stderr.log

## 1. 端口结果
| 端口 | 角色 | 通过 | 失败 | 总数 | 结果 | 报告 |
|---|---|---:|---:|---:|---|---|
| 5757 | 主服务端口 | 37 | 0 | 37 | PASS | port-5757.md |
| 57570 | Python daemon端口 | 2 | 0 | 2 | PASS | port-57570.md |
| 57571 | 插件端口 req-proxy | 1 | 0 | 1 | PASS | port-57571.md |
| 57572 | 插件端口 pvideo | 1 | 0 | 1 | PASS | port-57572.md |
| 57573 | 插件端口 pup-sniffer | 1 | 0 | 1 | PASS | port-57573.md |
| 57574 | 插件端口 mediaProxy | 1 | 0 | 1 | PASS | port-57574.md |
| 57575 | 独立WS端口 | 2 | 0 | 2 | PASS | port-57575.md |

## 2. 结论
- 用例总数: 45
- 通过: 45
- 失败: 0
- 总体: PASS

## 3. 业务判断
- 5757 为核心业务入口，接口族与引擎链路已验证。
- 57575 独立监听正常。
- 57570 通过TCP与PY引擎双重验证。
- 57571-57574 按插件配置状态给出未接入原因与探测证据。
