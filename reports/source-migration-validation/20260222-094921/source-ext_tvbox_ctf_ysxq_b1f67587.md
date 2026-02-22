# 源验证报告: CTF-播剧影视 [外部:tvbox]

- key: ext_tvbox_ctf_ysxq_b1f67587
- status: success
- message: 4/4 接口正常（play为附加探针）
- type/lang: 4/external_1
- api: http://127.0.0.1:7788/api/ysxq
- durationMs: 6

## 测试URL
- home: http://127.0.0.1:7788/api/ysxq
- category: http://127.0.0.1:7788/api/ysxq?ac=list&t=1&pg=1
- search: http://127.0.0.1:7788/api/ysxq?ac=list&wd=%E6%B5%8B%E8%AF%95
- detail: http://127.0.0.1:7788/api/ysxq?ac=detail&ids=ysxq_1
- play: http://127.0.0.1:7788/api/ysxq?ac=play&id=ysxq_1&play=1

## 详情
- home: success |  | http://127.0.0.1:7788/api/ysxq
- category: success |  | http://127.0.0.1:7788/api/ysxq?ac=list&t=1&pg=1
- search: success |  | http://127.0.0.1:7788/api/ysxq?ac=list&wd=%E6%B5%8B%E8%AF%95
- detail: success |  | http://127.0.0.1:7788/api/ysxq?ac=detail&ids=ysxq_1
- play: success |  | http://127.0.0.1:7788/api/ysxq?ac=play&id=ysxq_1&play=1

## 人工复核
- [ ] 通过
- [ ] 失败
- 备注: