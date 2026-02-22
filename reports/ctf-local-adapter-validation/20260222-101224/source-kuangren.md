# ctf_local 验证报告 - CTF-kuangren(Local)

- id: kuangren
- key: ctf_local_kuangren
- status: success
- api: http://127.0.0.1:5757/ctf-adapter/api/kuangren
- firstPlayableUrl: https://soul.ezplayer.me/hls/4Sl94K3NDr6mT4x_JDV3uA/pk8/5z1ivqb8/tmwzup/tt/master.m3u8
- streamProbe: ok | content-type=application/vnd.apple.mpegurl

## 接口检查
- home: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren
- list: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=list&t=1&pg=1
- search: ok | status=200 | items=0 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=search&wd=test
- detail: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=detail&ids=kuangren_1
- play: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=play&id=kuangren_1

## 人工复核
- [ ] 在播放器中导入该源并进入详情页
- [ ] 校验首条播放线路可起播且无明显花屏/卡顿
- [ ] 校验切换线路后仍可起播
- 备注: