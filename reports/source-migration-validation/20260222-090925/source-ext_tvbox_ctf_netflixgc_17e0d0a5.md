# 源验证报告: CTF-NetflixGC [外部:tvbox]

- key: ext_tvbox_ctf_netflixgc_17e0d0a5
- status: error
- message: 推荐和分类接口均异常
- type/lang: 4/external_1
- api: http://127.0.0.1:7788/api/netflixgc
- durationMs: 6

## 测试URL
- home: http://127.0.0.1:7788/api/netflixgc
- category: http://127.0.0.1:7788/api/netflixgc?ac=list&t=1&pg=1
- search: http://127.0.0.1:7788/api/netflixgc?ac=list&wd=%E6%B5%8B%E8%AF%95
- detail: http://127.0.0.1:7788/api/netflixgc?ac=detail&ids=1
- play: http://127.0.0.1:7788/api/netflixgc?ac=play&id=1&play=1

## 详情
- home: fail | request error: fetch failed | http://127.0.0.1:7788/api/netflixgc
- category: fail | request error: fetch failed | http://127.0.0.1:7788/api/netflixgc?ac=list&t=1&pg=1
- search: fail | request error: fetch failed | http://127.0.0.1:7788/api/netflixgc?ac=list&wd=%E6%B5%8B%E8%AF%95
- detail: fail | request error: fetch failed | http://127.0.0.1:7788/api/netflixgc?ac=detail&ids=1
- play: fail | request error: fetch failed | http://127.0.0.1:7788/api/netflixgc?ac=play&id=1&play=1

## 人工复核
- [ ] 通过
- [ ] 失败
- 备注: