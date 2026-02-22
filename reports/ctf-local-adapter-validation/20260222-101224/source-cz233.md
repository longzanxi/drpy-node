# ctf_local 验证报告 - CTF-cz233(Local)

- id: cz233
- key: ctf_local_cz233
- status: success
- api: http://127.0.0.1:5757/ctf-adapter/api/cz233
- firstPlayableUrl: https://119.91.61.181:906/hls3/hls/%E5%B3%A1%E8%B0%B7.m3u8
- streamProbe: ok | content-type=application/vnd.apple.mpegurl

## 接口检查
- home: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233
- list: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?ac=list&t=1&pg=1
- search: ok | status=200 | items=0 | http://127.0.0.1:5757/ctf-adapter/api/cz233?ac=search&wd=test
- detail: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?ac=detail&ids=cz233_1
- play: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?ac=play&id=cz233_1

## 人工复核
- [ ] 在播放器中导入该源并进入详情页
- [ ] 校验首条播放线路可起播且无明显花屏/卡顿
- [ ] 校验切换线路后仍可起播
- 备注: