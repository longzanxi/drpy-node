# 源验证报告: CTF-kanbot [外部:tvbox]

- key: ext_tvbox_ctf_kanbot_a05222cd
- status: success
- message: 3/4 接口正常（play为附加探针）
- type/lang: 4/external_1
- api: http://127.0.0.1:7788/api/kanbot
- durationMs: 29353

## 测试URL
- home: http://127.0.0.1:7788/api/kanbot
- category: http://127.0.0.1:7788/api/kanbot?ac=list&t=1&pg=1
- search: http://127.0.0.1:7788/api/kanbot?ac=list&wd=%E6%B5%8B%E8%AF%95
- detail: http://127.0.0.1:7788/api/kanbot?ac=detail&ids=kanbot_1
- play: http://127.0.0.1:7788/api/kanbot?ac=play&id=kanbot_1&play=1

## 详情
- home: fail | request error: This operation was aborted | http://127.0.0.1:7788/api/kanbot
- category: success |  | http://127.0.0.1:7788/api/kanbot?ac=list&t=1&pg=1
- search: success |  | http://127.0.0.1:7788/api/kanbot?ac=list&wd=%E6%B5%8B%E8%AF%95
- detail: success |  | http://127.0.0.1:7788/api/kanbot?ac=detail&ids=kanbot_1
- play: success |  | http://127.0.0.1:7788/api/kanbot?ac=play&id=kanbot_1&play=1

## 人工复核
- [ ] 通过
- [ ] 失败
- 备注: