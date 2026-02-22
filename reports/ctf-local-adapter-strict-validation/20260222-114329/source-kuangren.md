# ctf_local 严格验证报告 - CTF-kuangren(Local)

- id: kuangren
- key: ctf_local_kuangren
- status: success
- requiredChecks: 29/29
- api: http://127.0.0.1:5757/ctf-adapter/api/kuangren
- searchKeyword: kuan
- firstPlayableUrl: https://soul.ezplayer.me/hls/4Sl94K3NDr6mT4x_JDV3uA/pk8/5z1ivqb8/tmwzup/tt/master.m3u8

## 严格断言结果
- [PASS] home.default.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren
- [PASS] home.default.class | required=true | status=200 | class_len=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren
- [PASS] home.default.list | required=true | status=200 | list_len=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren
- [PASS] home.default.vod | required=true | status=200 | vod_id=kuangren_1,play_lines=3 | http://127.0.0.1:5757/ctf-adapter/api/kuangren
- [PASS] home.ac.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=home
- [PASS] home.ac.same_id | required=true | status=200 | default=kuangren_1,ac=kuangren_1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=home
- [PASS] list.pg1.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.meta | required=true | status=200 | page=1,limit=1,total=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.size | required=true | status=200 | len=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.same_id | required=true | status=200 | home=kuangren_1,list=kuangren_1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg999.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.clamp | required=true | status=200 | page=1,pagecount=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.size | required=true | status=200 | total=1,len=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=list&t=1&pg=999&limit=1
- [PASS] search.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=search&wd=kuan
- [PASS] search.pos.hit | required=true | status=200 | wd=kuan,hits=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=search&wd=kuan
- [PASS] search.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=search&wd=__strict_not_found_1771731822871_nua4gv
- [PASS] search.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=search&wd=__strict_not_found_1771731822871_nua4gv
- [PASS] detail.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=detail&ids=kuangren_1
- [PASS] detail.pos.hit | required=true | status=200 | len=1,id=kuangren_1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=detail&ids=kuangren_1
- [PASS] detail.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=detail&ids=kuangren_1_not_exists
- [PASS] detail.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=detail&ids=kuangren_1_not_exists
- [PASS] videolist.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=videolist&ids=kuangren_1
- [PASS] videolist.hit | required=true | status=200 | len=1,id=kuangren_1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=videolist&ids=kuangren_1
- [PASS] play.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=play&id=kuangren_1&play=1
- [PASS] play.parse_zero | required=true | status=200 | parse=0 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=play&id=kuangren_1&play=1
- [PASS] play.url.nonempty | required=true | status=200 | url=https://soul.ezplayer.me/hls/4Sl94K3NDr6mT4x_JDV3uA/pk8/5z1ivqb8/tmwzup/tt/master.m3u8 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=play&id=kuangren_1&play=1
- [PASS] play.url.expected_first | required=true | status=200 | expected=https://soul.ezplayer.me/hls/4Sl94K3NDr6mT4x_JDV3uA/pk8/5z1ivqb8/tmwzup/tt/master.m3u8 actual=https://soul.ezplayer.me/hls/4Sl94K3NDr6mT4x_JDV3uA/pk8/5z1ivqb8/tmwzup/tt/ma | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=play&id=kuangren_1&play=1
- [PASS] play.url.media | required=true | status=200 | url=https://soul.ezplayer.me/hls/4Sl94K3NDr6mT4x_JDV3uA/pk8/5z1ivqb8/tmwzup/tt/master.m3u8 | http://127.0.0.1:5757/ctf-adapter/api/kuangren?ac=play&id=kuangren_1&play=1
- [PASS] play.url.probe | required=true | status=200 | content-type=application/vnd.apple.mpegurl | https://soul.ezplayer.me/hls/4Sl94K3NDr6mT4x_JDV3uA/pk8/5z1ivqb8/tmwzup/tt/master.m3u8
- [FAIL] play.alt.probe | required=false | status=403 | HTTP 403 | https://185.237.106.95/v4/xUYd0gD-rabj0PEvsQ5qYA/1771620664/pk8/98dem/master.m3u8?v=1770717509

## 自动探测线路
- 1. ok | status=200 | content-type=application/vnd.apple.mpegurl | https://soul.ezplayer.me/hls/4Sl94K3NDr6mT4x_JDV3uA/pk8/5z1ivqb8/tmwzup/tt/master.m3u8
- 2. fail | status=403 | HTTP 403 | https://185.237.106.95/v4/xUYd0gD-rabj0PEvsQ5qYA/1771620664/pk8/98dem/master.m3u8?v=1770717509
- 3. fail | status=403 | HTTP 403 | https://185.237.106.95/v4/C9Rn1p-H0k4Wz6Zvn1n0yg/1771244727/pk8/98dem/master.m3u8?v=1770717509

## 人工复核
- [ ] 已在客户端导入验证
- [ ] 首页可打开
- [ ] 搜索可命中
- [ ] 分页行为正确
- [ ] 详情可打开
- [ ] 播放可起播
- [ ] 切线可起播
- 备注: