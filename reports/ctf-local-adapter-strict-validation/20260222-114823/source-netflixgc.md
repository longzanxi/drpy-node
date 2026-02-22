# ctf_local 严格验证报告 - CTF-netflixgc(Local)

- id: netflixgc
- key: ctf_local_netflixgc
- status: success
- requiredChecks: 29/29
- api: http://127.0.0.1:5757/ctf-adapter/api/netflixgc
- searchKeyword: netf
- firstPlayableUrl: https://json.ksdiy.cn/Vtche/FF/4100819155.m3u8

## 严格断言结果
- [PASS] home.default.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc
- [PASS] home.default.class | required=true | status=200 | class_len=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc
- [PASS] home.default.list | required=true | status=200 | list_len=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc
- [PASS] home.default.vod | required=true | status=200 | vod_id=netflixgc_1,play_lines=3 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc
- [PASS] home.ac.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=home
- [PASS] home.ac.same_id | required=true | status=200 | default=netflixgc_1,ac=netflixgc_1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=home
- [PASS] list.pg1.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.meta | required=true | status=200 | page=1,limit=1,total=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.size | required=true | status=200 | len=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.same_id | required=true | status=200 | home=netflixgc_1,list=netflixgc_1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg999.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.clamp | required=true | status=200 | page=1,pagecount=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.size | required=true | status=200 | total=1,len=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=list&t=1&pg=999&limit=1
- [PASS] search.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=search&wd=netf
- [PASS] search.pos.hit | required=true | status=200 | wd=netf,hits=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=search&wd=netf
- [PASS] search.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=search&wd=__strict_not_found_1771732114510_o8fw20
- [PASS] search.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=search&wd=__strict_not_found_1771732114510_o8fw20
- [PASS] detail.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=detail&ids=netflixgc_1
- [PASS] detail.pos.hit | required=true | status=200 | len=1,id=netflixgc_1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=detail&ids=netflixgc_1
- [PASS] detail.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=detail&ids=netflixgc_1_not_exists
- [PASS] detail.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=detail&ids=netflixgc_1_not_exists
- [PASS] videolist.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=videolist&ids=netflixgc_1
- [PASS] videolist.hit | required=true | status=200 | len=1,id=netflixgc_1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=videolist&ids=netflixgc_1
- [PASS] play.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=play&id=netflixgc_1&play=1
- [PASS] play.parse_zero | required=true | status=200 | parse=0 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=play&id=netflixgc_1&play=1
- [PASS] play.url.nonempty | required=true | status=200 | url=https://json.ksdiy.cn/Vtche/FF/4100819155.m3u8 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=play&id=netflixgc_1&play=1
- [PASS] play.url.expected_first | required=true | status=200 | expected=https://json.ksdiy.cn/Vtche/FF/4100819155.m3u8 actual=https://json.ksdiy.cn/Vtche/FF/4100819155.m3u8 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=play&id=netflixgc_1&play=1
- [PASS] play.url.media | required=true | status=200 | url=https://json.ksdiy.cn/Vtche/FF/4100819155.m3u8 | http://127.0.0.1:5757/ctf-adapter/api/netflixgc?ac=play&id=netflixgc_1&play=1
- [PASS] play.url.probe | required=true | status=200 | content-type=application/vnd.apple.mpegurl | https://json.ksdiy.cn/Vtche/FF/4100819155.m3u8
- [PASS] play.alt.probe | required=false | status=200 | content-type=application/vnd.apple.mpegurl | https://json.ksdiy.cn/Vtche/YZ/3919318965.m3u8

## 自动探测线路
- 1. ok | status=200 | content-type=application/vnd.apple.mpegurl | https://json.ksdiy.cn/Vtche/FF/4100819155.m3u8
- 2. ok | status=200 | content-type=application/vnd.apple.mpegurl | https://json.ksdiy.cn/Vtche/YZ/3919318965.m3u8
- 3. ok | status=200 | content-type=application/vnd.apple.mpegurl | https://vip.dytt-see.com/20251107/5052_86b48b56/index.m3u8

## 人工复核
- [ ] 已在客户端导入验证
- [ ] 首页可打开
- [ ] 搜索可命中
- [ ] 分页行为正确
- [ ] 详情可打开
- [ ] 播放可起播
- [ ] 切线可起播
- 备注: