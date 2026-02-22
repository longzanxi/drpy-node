# 全量源并发检测汇总报告

- 时间: 2026-02-22T01:07:04.913Z ~ 2026-02-22T01:08:09.231Z
- 配置地址: http://127.0.0.1:5757/config/1?sub=all&healthy=0&pwd=
- 模式: full
- 并发数: 20
- 超时(ms): 12000
- 总数: 302
- 成功: 220
- 失败: 56
- 待人工: 26
- 服务由脚本启动: true

## 按类型统计
- type=3: 95
- type=4: 207

## 按语言统计
- lang=cat: 19
- lang=dr2: 11
- lang=ds: 156
- lang=external_1: 23
- lang=external_3: 2
- lang=hipy: 63
- lang=unknown: 28

## 结果分布
- success: 220
- error: 56
- pending: 26

## 说明
- type=4 使用接口链路探测（home/category/search/detail，附加play探针）。
- type=3 使用资源可加载性探测（api/ext）。
- assets:// 与对象型 ext 无法纯服务端自动执行，标记为 pending 并进入人工校验清单。