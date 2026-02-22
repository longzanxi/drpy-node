# ctf_local 验证报告 - CTF-kanbot(Local)

- id: kanbot
- key: ctf_local_kanbot
- status: success
- api: http://127.0.0.1:5757/ctf-adapter/api/kanbot
- firstPlayableUrl: https://cdn.yzzy29-play.com/20260215/20128_9abcd7ad/2000k/hls/mixed.m3u8
- streamProbe: ok | content-type=application/vnd.apple.mpegurl

## 接口检查
- home: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot
- list: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?ac=list&t=1&pg=1
- search: ok | status=200 | items=0 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?ac=search&wd=test
- detail: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?ac=detail&ids=kanbot_1
- play: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?ac=play&id=kanbot_1

## 人工复核
- [ ] 在播放器中导入该源并进入详情页
- [ ] 校验首条播放线路可起播且无明显花屏/卡顿
- [ ] 校验切换线路后仍可起播

## 自动探测线路
- 1. ok | status=200 | content-type=application/vnd.apple.mpegurl | https://cdn.yzzy29-play.com/20260215/20128_9abcd7ad/2000k/hls/mixed.m3u8
- 备注: