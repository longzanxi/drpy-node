# ctf_local 验证报告 - CTF-aiyifan(Local)

- id: aiyifan
- key: ctf_local_aiyifan
- status: success
- api: http://127.0.0.1:5757/ctf-adapter/api/aiyifan
- firstPlayableUrl: https://s1-a1.global-cdn.me/vod/8390EA63781-74441.mp4
- streamProbe: ok | content-type=video/mp4

## 接口检查
- home: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan
- list: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=list&t=1&pg=1
- search: ok | status=200 | items=0 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=search&wd=test
- detail: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=detail&ids=aiyifan_1
- play: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=play&id=aiyifan_1

## 人工复核
- [ ] 在播放器中导入该源并进入详情页
- [ ] 校验首条播放线路可起播且无明显花屏/卡顿
- [ ] 校验切换线路后仍可起播
- 备注: