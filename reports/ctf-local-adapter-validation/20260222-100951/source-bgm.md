# ctf_local 验证报告 - CTF-bgm(Local)

- id: bgm
- key: ctf_local_bgm
- status: error
- api: http://127.0.0.1:5757/ctf-adapter/api/bgm
- firstPlayableUrl: https://ai.girigirilove.net/zijian/oldanime/2026/01/cht/OsananajimitowaLoveComedyniNaranaiCHT/01/playlist.m3u8
- streamProbe: ok | stream_signature_matched

## 接口检查
- home: fail | status=-1 | This operation was aborted | http://127.0.0.1:5757/ctf-adapter/api/bgm
- list: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/bgm?ac=list&t=1&pg=1
- search: ok | status=200 | items=0 | http://127.0.0.1:5757/ctf-adapter/api/bgm?ac=search&wd=test
- detail: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/bgm?ac=detail&ids=bgm_1
- play: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/bgm?ac=play&id=bgm_1

## 人工复核
- [ ] 在播放器中导入该源并进入详情页
- [ ] 校验首条播放线路可起播且无明显花屏/卡顿
- [ ] 校验切换线路后仍可起播
- 备注: