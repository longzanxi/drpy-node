# 源验证报告: CTF-bgm [外部:tvbox]

- key: ext_tvbox_ctf_bgm_f0785b8a
- status: success
- message: 3/4 接口正常（play为附加探针）
- type/lang: 4/external_1
- api: http://127.0.0.1:7788/api/bgm
- durationMs: 23745

## 测试URL
- home: http://127.0.0.1:7788/api/bgm
- category: http://127.0.0.1:7788/api/bgm?ac=list&t=1&pg=1
- search: http://127.0.0.1:7788/api/bgm?ac=list&wd=%E6%B5%8B%E8%AF%95
- detail: http://127.0.0.1:7788/api/bgm?ac=detail&ids=bgm_1
- play: http://127.0.0.1:7788/api/bgm?ac=play&id=bgm_1&play=1

## 详情
- home: fail | request error: This operation was aborted | http://127.0.0.1:7788/api/bgm
- category: success |  | http://127.0.0.1:7788/api/bgm?ac=list&t=1&pg=1
- search: success |  | http://127.0.0.1:7788/api/bgm?ac=list&wd=%E6%B5%8B%E8%AF%95
- detail: success |  | http://127.0.0.1:7788/api/bgm?ac=detail&ids=bgm_1
- play: success |  | http://127.0.0.1:7788/api/bgm?ac=play&id=bgm_1&play=1

## 人工复核
- [ ] 通过
- [ ] 失败
- 备注: