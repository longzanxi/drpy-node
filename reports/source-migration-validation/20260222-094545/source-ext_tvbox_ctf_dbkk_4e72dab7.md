# 源验证报告: CTF-独播库 [外部:tvbox]

- key: ext_tvbox_ctf_dbkk_4e72dab7
- status: success
- message: 4/4 接口正常（play为附加探针）
- type/lang: 4/external_1
- api: http://127.0.0.1:7788/api/dbkk
- durationMs: 1429

## 测试URL
- home: http://127.0.0.1:7788/api/dbkk
- category: http://127.0.0.1:7788/api/dbkk?ac=list&t=1&pg=1
- search: http://127.0.0.1:7788/api/dbkk?ac=list&wd=%E6%B5%8B%E8%AF%95
- detail: http://127.0.0.1:7788/api/dbkk?ac=detail&ids=dbkk_1
- play: http://127.0.0.1:7788/api/dbkk?ac=play&id=dbkk_1&play=1

## 详情
- home: success |  | http://127.0.0.1:7788/api/dbkk
- category: success |  | http://127.0.0.1:7788/api/dbkk?ac=list&t=1&pg=1
- search: success |  | http://127.0.0.1:7788/api/dbkk?ac=list&wd=%E6%B5%8B%E8%AF%95
- detail: success |  | http://127.0.0.1:7788/api/dbkk?ac=detail&ids=dbkk_1
- play: success |  | http://127.0.0.1:7788/api/dbkk?ac=play&id=dbkk_1&play=1

## 人工复核
- [ ] 通过
- [ ] 失败
- 备注: