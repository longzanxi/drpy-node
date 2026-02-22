# 源验证报告: CTF-NetflixGC [外部:tvbox]

- key: ext_tvbox_ctf_netflixgc_01dd7d22
- status: success
- message: 4/4 接口正常（play为附加探针）
- type/lang: 4/external_1
- api: https://ctf-tvbox-gateway-20260221.knieclarine.workers.dev/api/netflixgc
- durationMs: 3359

## 测试URL
- home: https://ctf-tvbox-gateway-20260221.knieclarine.workers.dev/api/netflixgc
- category: https://ctf-tvbox-gateway-20260221.knieclarine.workers.dev/api/netflixgc?ac=list&t=1&pg=1
- search: https://ctf-tvbox-gateway-20260221.knieclarine.workers.dev/api/netflixgc?ac=list&wd=%E6%B5%8B%E8%AF%95
- detail: https://ctf-tvbox-gateway-20260221.knieclarine.workers.dev/api/netflixgc?ac=detail&ids=910001
- play: https://ctf-tvbox-gateway-20260221.knieclarine.workers.dev/api/netflixgc?ac=play&id=910001&play=1

## 详情
- home: success |  | https://ctf-tvbox-gateway-20260221.knieclarine.workers.dev/api/netflixgc
- category: success |  | https://ctf-tvbox-gateway-20260221.knieclarine.workers.dev/api/netflixgc?ac=list&t=1&pg=1
- search: success |  | https://ctf-tvbox-gateway-20260221.knieclarine.workers.dev/api/netflixgc?ac=list&wd=%E6%B5%8B%E8%AF%95
- detail: success |  | https://ctf-tvbox-gateway-20260221.knieclarine.workers.dev/api/netflixgc?ac=detail&ids=910001
- play: success |  | https://ctf-tvbox-gateway-20260221.knieclarine.workers.dev/api/netflixgc?ac=play&id=910001&play=1

## 人工复核
- [ ] 通过
- [ ] 失败
- 备注: