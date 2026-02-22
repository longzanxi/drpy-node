# ctf_local 严格验证报告 - CTF-aiyifan(Local)

- id: aiyifan
- key: ctf_local_aiyifan
- status: success
- requiredChecks: 29/29
- api: http://127.0.0.1:5757/ctf-adapter/api/aiyifan
- searchKeyword: aiyi
- firstPlayableUrl: https://s1-a1.global-cdn.me/vod/8390EA63781-74441.mp4

## 严格断言结果
- [PASS] home.default.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan
- [PASS] home.default.class | required=true | status=200 | class_len=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan
- [PASS] home.default.list | required=true | status=200 | list_len=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan
- [PASS] home.default.vod | required=true | status=200 | vod_id=aiyifan_1,play_lines=18 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan
- [PASS] home.ac.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=home
- [PASS] home.ac.same_id | required=true | status=200 | default=aiyifan_1,ac=aiyifan_1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=home
- [PASS] list.pg1.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.meta | required=true | status=200 | page=1,limit=1,total=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.size | required=true | status=200 | len=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.same_id | required=true | status=200 | home=aiyifan_1,list=aiyifan_1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg999.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.clamp | required=true | status=200 | page=1,pagecount=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.size | required=true | status=200 | total=1,len=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=list&t=1&pg=999&limit=1
- [PASS] search.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=search&wd=aiyi
- [PASS] search.pos.hit | required=true | status=200 | wd=aiyi,hits=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=search&wd=aiyi
- [PASS] search.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=search&wd=__strict_not_found_1771730933587_a96dij
- [PASS] search.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=search&wd=__strict_not_found_1771730933587_a96dij
- [PASS] detail.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=detail&ids=aiyifan_1
- [PASS] detail.pos.hit | required=true | status=200 | len=1,id=aiyifan_1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=detail&ids=aiyifan_1
- [PASS] detail.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=detail&ids=aiyifan_1_not_exists
- [PASS] detail.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=detail&ids=aiyifan_1_not_exists
- [PASS] videolist.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=videolist&ids=aiyifan_1
- [PASS] videolist.hit | required=true | status=200 | len=1,id=aiyifan_1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=videolist&ids=aiyifan_1
- [PASS] play.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=play&id=aiyifan_1&play=1
- [PASS] play.parse_zero | required=true | status=200 | parse=0 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=play&id=aiyifan_1&play=1
- [PASS] play.url.nonempty | required=true | status=200 | url=https://s1-a1.global-cdn.me/vod/8390EA63781-74441.mp4 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=play&id=aiyifan_1&play=1
- [PASS] play.url.expected_first | required=true | status=200 | expected=https://s1-a1.global-cdn.me/vod/8390EA63781-74441.mp4 actual=https://s1-a1.global-cdn.me/vod/8390EA63781-74441.mp4 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=play&id=aiyifan_1&play=1
- [PASS] play.url.media | required=true | status=200 | url=https://s1-a1.global-cdn.me/vod/8390EA63781-74441.mp4 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=play&id=aiyifan_1&play=1
- [PASS] play.url.probe | required=true | status=206 | content-type=video/mp4 | https://s1-a1.global-cdn.me/vod/8390EA63781-74441.mp4
- [FAIL] play.alt.probe | required=false | status=403 | HTTP 403 | https://global.dudupro.com/s2/ppot/_definst_/mp4:s17/live/lxj-sxfysmfsd1j-07-03491EA44.mp4/chunklist.m3u8?vendtime=1771437743&vhash=S-ZF1up3qzTtvCZIepMNfaUYQRV_NONp7r6z3eOd8Bs=&vCustomParameter=0_140.245.72.39_KR_1_0_1&lb=029813cf9d9913c131504effd38518e0&us=1&proxy=Sp8jPJ4kPsLkPN9XR6DaRYvZRsryEPaMifYNDpAxkxoniZSNCRUslZcP5hAObpSokxoxE32NCRUslZcP5hAObpSokxoxE38NCRUslZcP5hAObp2vCh4yNHbBdXvU2&proxyize=5

## 自动探测线路
- 1. ok | status=206 | content-type=video/mp4 | https://s1-a1.global-cdn.me/vod/8390EA63781-74441.mp4
- 2. fail | status=403 | HTTP 403 | https://global.dudupro.com/s2/ppot/_definst_/mp4:s17/live/lxj-sxfysmfsd1j-07-03491EA44.mp4/chunklist.m3u8?vendtime=1771437743&vhash=S-ZF1up3qzTtvCZIepMNfaUYQRV_NONp7r6z3eOd8Bs=&vCustomParameter=0_140.245.72.39_KR_1_0_1&lb=029813cf9d9913c131504effd38518e0&us=1&proxy=Sp8jPJ4kPsLkPN9XR6DaRYvZRsryEPaMifYNDpAxkxoniZSNCRUslZcP5hAObpSokxoxE32NCRUslZcP5hAObpSokxoxE38NCRUslZcP5hAObp2vCh4yNHbBdXvU2&proxyize=5
- 3. ok | status=200 | content-type=application/dash+xml | https://global.dudupro.com/s2/ppot/_definst_/mp4:s17/live/lxj-sxfysmfsd1j-07-03491EA44.mp4/manifest.mpd?vendtime=1771437743&vhash=S-ZF1up3qzTtvCZIepMNfaUYQRV_NONp7r6z3eOd8Bs=&vCustomParameter=0_140.245.72.39_KR_1_0_1&lb=029813cf9d9913c131504effd38518e0&us=1&proxy=Sp8jPJ4kPsLkPN9XR6DaRYvZRsryEPaMifYNDpAxkxoniZSNCRUslZcP5hAObpSokxoxE32NCRUslZcP5hAObpSokxoxE38NCRUslZcP5hAObp2vCh4yNHbBdXvU2&proxyize=5

## 人工复核
- [ ] 已在客户端导入验证
- [ ] 首页可打开
- [ ] 搜索可命中
- [ ] 分页行为正确
- [ ] 详情可打开
- [ ] 播放可起播
- [ ] 切线可起播
- 备注: