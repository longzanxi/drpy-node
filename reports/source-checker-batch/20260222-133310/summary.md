# 全量源并发检测汇总报告

- 时间: 2026-02-22T05:33:10.823Z ~ 2026-02-22T05:35:25.704Z
- 配置地址: http://127.0.0.1:5757/config/1?sub=all&healthy=0&pwd=
- 模式: full
- 并发数: 8
- 超时(ms): 60000
- 总数: 279
- 成功: 259
- 失败: 6
- 待人工: 14
- 服务由脚本启动: true

## 按类型统计
- type=3: 116
- type=4: 163

## 按语言统计
- lang=cat: 19
- lang=ctf_local: 11
- lang=dr2: 11
- lang=ds: 140
- lang=external_1: 13
- lang=external_3: 27
- lang=hipy: 57
- lang=unknown: 1

## 结果分布
- success: 259
- error: 6
- pending: 14

## 说明
- type=4 使用接口链路探测（home/category/search/detail，附加play探针）。
- type=3 使用资源可加载性探测（api/ext）。
- assets:// 与对象型 ext 无法纯服务端自动执行，标记为 pending 并进入人工校验清单。