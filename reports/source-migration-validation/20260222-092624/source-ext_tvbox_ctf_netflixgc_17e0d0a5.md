# 源验证报告: CTF-NetflixGC [外部:tvbox]

- key: ext_tvbox_ctf_netflixgc_17e0d0a5
- status: success
- message: 3/4 接口正常（play为附加探针）
- type/lang: 4/external_1
- api: http://127.0.0.1:7788/api/netflixgc
- durationMs: 25719

## 测试URL
- home: http://127.0.0.1:7788/api/netflixgc
- category: http://127.0.0.1:7788/api/netflixgc?ac=list&t=1&pg=1
- search: http://127.0.0.1:7788/api/netflixgc?ac=list&wd=%E6%B5%8B%E8%AF%95
- detail: http://127.0.0.1:7788/api/netflixgc?ac=detail&ids=netflixgc_1
- play: http://127.0.0.1:7788/api/netflixgc?ac=play&id=netflixgc_1&play=1

## 详情
- home: fail | request error: This operation was aborted | http://127.0.0.1:7788/api/netflixgc
- category: success |  | http://127.0.0.1:7788/api/netflixgc?ac=list&t=1&pg=1
- search: success |  | http://127.0.0.1:7788/api/netflixgc?ac=list&wd=%E6%B5%8B%E8%AF%95
- detail: success |  | http://127.0.0.1:7788/api/netflixgc?ac=detail&ids=netflixgc_1
- play: success |  | http://127.0.0.1:7788/api/netflixgc?ac=play&id=netflixgc_1&play=1

## 人工复核
- [ ] 通过
- [ ] 失败
- 备注: