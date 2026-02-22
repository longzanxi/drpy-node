# ctf_local 验证报告 - CTF-netflixgc(Local)

- id: netflixgc
- key: ctf_local_netflixgc
- status: success
- api: http://127.0.0.1:5757/ctf-adapter/api/netflixgc
- firstPlayableUrl: https://json.ksdiy.cn/Vtche/FF/4100819155.m3u8
- streamProbe: ok | content-type=application/vnd.apple.mpegurl

## 接口检查
- home: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc
- list: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=list&t=1&pg=1
- search: ok | status=200 | items=0 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=search&wd=test
- detail: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=detail&ids=netflixgc_1
- play: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=play&id=netflixgc_1

## 人工复核
- [ ] 在播放器中导入该源并进入详情页
- [ ] 校验首条播放线路可起播且无明显花屏/卡顿
- [ ] 校验切换线路后仍可起播

## 自动探测线路
- 1. ok | status=200 | content-type=application/vnd.apple.mpegurl | https://json.ksdiy.cn/Vtche/FF/4100819155.m3u8
- 备注: