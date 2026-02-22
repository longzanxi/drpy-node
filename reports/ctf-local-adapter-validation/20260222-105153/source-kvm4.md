# ctf_local 验证报告 - CTF-4kvm(Local)

- id: kvm4
- key: ctf_local_kvm4
- status: success
- api: http://127.0.0.1:5757/ctf-adapter/api/kvm4
- firstPlayableUrl: https://play.kvmplay.org/m3/e5fa5a31771771937/20Njk5YTZmNjEyODJkOSQzNTY3JDEkMTc3MTcyODczNw699a6f61282d6.m3u8
- streamProbe: ok | content-type=application/vnd.apple.mpegurl

## 接口检查
- home: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4
- list: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=list&t=1&pg=1
- search: ok | status=200 | items=0 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=search&wd=test
- detail: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=detail&ids=kvm4_1
- play: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=play&id=kvm4_1

## 人工复核
- [ ] 在播放器中导入该源并进入详情页
- [ ] 校验首条播放线路可起播且无明显花屏/卡顿
- [ ] 校验切换线路后仍可起播

## 自动探测线路
- 1. ok | status=200 | content-type=application/vnd.apple.mpegurl | https://play.kvmplay.org/m3/e5fa5a31771771937/20Njk5YTZmNjEyODJkOSQzNTY3JDEkMTc3MTcyODczNw699a6f61282d6.m3u8
- 备注: