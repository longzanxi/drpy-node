# ctf_local 验证报告 - CTF-iyf(Local)

- id: iyf
- key: ctf_local_iyf
- status: success
- api: http://127.0.0.1:5757/ctf-adapter/api/iyf
- firstPlayableUrl: https://s1-a1.global-cdn.me/vod/11611D87803-61387.mp4
- streamProbe: ok | content-type=video/mp4

## 接口检查
- home: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf
- list: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?ac=list&t=1&pg=1
- search: ok | status=200 | items=0 | http://127.0.0.1:5757/ctf-adapter/api/iyf?ac=search&wd=test
- detail: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?ac=detail&ids=iyf_1
- play: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?ac=play&id=iyf_1

## 人工复核
- [ ] 在播放器中导入该源并进入详情页
- [ ] 校验首条播放线路可起播且无明显花屏/卡顿
- [ ] 校验切换线路后仍可起播
- 备注: