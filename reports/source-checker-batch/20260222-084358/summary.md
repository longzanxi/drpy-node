# 全量源并发检测汇总报告

- 时间: 2026-02-22T00:43:58.649Z ~ 2026-02-22T00:45:31.109Z
- 配置地址: http://127.0.0.1:5757/config/1?sub=all&healthy=0&pwd=
- 模式: full
- 并发数: 16
- 超时(ms): 12000
- 总数: 277
- 成功: 209
- 失败: 42
- 待人工: 26
- 服务由脚本启动: true

## 按类型统计
- type=3: 95
- type=4: 182

## 按语言统计
- lang=cat: 19
- lang=dr2: 11
- lang=ds: 156
- lang=hipy: 63
- lang=unknown: 28

## 结果分布
- success: 209
- error: 42
- pending: 26

## 说明
- type=4 使用接口链路探测（home/category/search/detail，附加play探针）。
- type=3 使用资源可加载性探测（api/ext）。
- assets:// 与对象型 ext 无法纯服务端自动执行，标记为 pending 并进入人工校验清单。