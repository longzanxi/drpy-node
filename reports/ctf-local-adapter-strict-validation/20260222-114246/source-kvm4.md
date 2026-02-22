# ctf_local 严格验证报告 - CTF-4kvm(Local)

- id: kvm4
- key: ctf_local_kvm4
- status: success
- requiredChecks: 29/29
- api: http://127.0.0.1:5757/ctf-adapter/api/kvm4
- searchKeyword: 4kvm
- firstPlayableUrl: https://play.kvmplay.org/m3/dc4a95d1771214316/58Njk5MWVkMmMzOTJlYiQzNTY3JDEkMTc3MTE3MTExNg6991ed2c392e8.m3u8

## 严格断言结果
- [PASS] home.default.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4
- [PASS] home.default.class | required=true | status=200 | class_len=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4
- [PASS] home.default.list | required=true | status=200 | list_len=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4
- [PASS] home.default.vod | required=true | status=200 | vod_id=kvm4_1,play_lines=2 | http://127.0.0.1:5757/ctf-adapter/api/kvm4
- [PASS] home.ac.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=home
- [PASS] home.ac.same_id | required=true | status=200 | default=kvm4_1,ac=kvm4_1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=home
- [PASS] list.pg1.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.meta | required=true | status=200 | page=1,limit=1,total=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.size | required=true | status=200 | len=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.same_id | required=true | status=200 | home=kvm4_1,list=kvm4_1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg999.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.clamp | required=true | status=200 | page=1,pagecount=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.size | required=true | status=200 | total=1,len=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=list&t=1&pg=999&limit=1
- [PASS] search.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=search&wd=4kvm
- [PASS] search.pos.hit | required=true | status=200 | wd=4kvm,hits=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=search&wd=4kvm
- [PASS] search.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=search&wd=__strict_not_found_1771731774549_ukun9t
- [PASS] search.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=search&wd=__strict_not_found_1771731774549_ukun9t
- [PASS] detail.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=detail&ids=kvm4_1
- [PASS] detail.pos.hit | required=true | status=200 | len=1,id=kvm4_1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=detail&ids=kvm4_1
- [PASS] detail.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=detail&ids=kvm4_1_not_exists
- [PASS] detail.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=detail&ids=kvm4_1_not_exists
- [PASS] videolist.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=videolist&ids=kvm4_1
- [PASS] videolist.hit | required=true | status=200 | len=1,id=kvm4_1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=videolist&ids=kvm4_1
- [PASS] play.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=play&id=kvm4_1&play=1
- [PASS] play.parse_zero | required=true | status=200 | parse=0 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=play&id=kvm4_1&play=1
- [PASS] play.url.nonempty | required=true | status=200 | url=https://play.kvmplay.org/m3/dc4a95d1771214316/58Njk5MWVkMmMzOTJlYiQzNTY3JDEkMTc3MTE3MTExNg6991ed2c392e8.m3u8 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=play&id=kvm4_1&play=1
- [PASS] play.url.expected_first | required=true | status=200 | expected=https://play.kvmplay.org/m3/dc4a95d1771214316/58Njk5MWVkMmMzOTJlYiQzNTY3JDEkMTc3MTE3MTExNg6991ed2c392e8.m3u8 actual=https://play.kvmplay.org/m3/dc4a95d1771214316/58Njk5MWV | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=play&id=kvm4_1&play=1
- [PASS] play.url.media | required=true | status=200 | url=https://play.kvmplay.org/m3/dc4a95d1771214316/58Njk5MWVkMmMzOTJlYiQzNTY3JDEkMTc3MTE3MTExNg6991ed2c392e8.m3u8 | http://127.0.0.1:5757/ctf-adapter/api/kvm4?ac=play&id=kvm4_1&play=1
- [PASS] play.url.probe | required=true | status=200 | content-type=application/vnd.apple.mpegurl | https://play.kvmplay.org/m3/dc4a95d1771214316/58Njk5MWVkMmMzOTJlYiQzNTY3JDEkMTc3MTE3MTExNg6991ed2c392e8.m3u8
- [PASS] play.alt.probe | required=false | status=200 | content-type=application/vnd.apple.mpegurl | https://play.kvmplay.org/m3/d86dcbe1771653498/95Njk5OGEwYmFlN2RhNyQzNTY3JDEkMTc3MTYxMDI5OA6998a0bae7da4.m3u8

## 自动探测线路
- 1. ok | status=200 | content-type=application/vnd.apple.mpegurl | https://play.kvmplay.org/m3/dc4a95d1771214316/58Njk5MWVkMmMzOTJlYiQzNTY3JDEkMTc3MTE3MTExNg6991ed2c392e8.m3u8
- 2. ok | status=200 | content-type=application/vnd.apple.mpegurl | https://play.kvmplay.org/m3/d86dcbe1771653498/95Njk5OGEwYmFlN2RhNyQzNTY3JDEkMTc3MTYxMDI5OA6998a0bae7da4.m3u8

## 人工复核
- [ ] 已在客户端导入验证
- [ ] 首页可打开
- [ ] 搜索可命中
- [ ] 分页行为正确
- [ ] 详情可打开
- [ ] 播放可起播
- [ ] 切线可起播
- 备注: