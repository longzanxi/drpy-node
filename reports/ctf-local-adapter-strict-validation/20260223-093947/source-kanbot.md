# ctf_local 严格验证报告 - CTF-kanbot(Local)

- id: kanbot
- key: ctf_local_kanbot
- status: success
- requiredChecks: 29/29
- api: http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds
- searchKeyword: kanb
- firstPlayableUrl: https://v.lzcdn28.com/20260215/8578_a032d144/2000k/hls/mixed.m3u8

## 严格断言结果
- [PASS] home.default.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds
- [PASS] home.default.class | required=true | status=200 | class_len=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds
- [PASS] home.default.list | required=true | status=200 | list_len=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds
- [PASS] home.default.vod | required=true | status=200 | vod_id=kanbot_1,play_lines=6 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds
- [PASS] home.ac.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=home
- [PASS] home.ac.same_id | required=true | status=200 | default=kanbot_1,ac=kanbot_1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=home
- [PASS] list.pg1.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.meta | required=true | status=200 | page=1,limit=1,total=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.size | required=true | status=200 | len=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.same_id | required=true | status=200 | home=kanbot_1,list=kanbot_1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=list&t=1&pg=1&limit=1
- [PASS] list.pg999.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.clamp | required=true | status=200 | page=1,pagecount=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.size | required=true | status=200 | total=1,len=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=list&t=1&pg=999&limit=1
- [PASS] search.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=search&wd=kanb
- [PASS] search.pos.hit | required=true | status=200 | wd=kanb,hits=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=search&wd=kanb
- [PASS] search.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=search&wd=__strict_not_found_1771810806828_epgvxo
- [PASS] search.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=search&wd=__strict_not_found_1771810806828_epgvxo
- [PASS] detail.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=detail&ids=kanbot_1
- [PASS] detail.pos.hit | required=true | status=200 | len=1,id=kanbot_1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=detail&ids=kanbot_1
- [PASS] detail.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=detail&ids=kanbot_1_not_exists
- [PASS] detail.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=detail&ids=kanbot_1_not_exists
- [PASS] videolist.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=videolist&ids=kanbot_1
- [PASS] videolist.hit | required=true | status=200 | len=1,id=kanbot_1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=videolist&ids=kanbot_1
- [PASS] play.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=play&id=kanbot_1&play=1
- [PASS] play.parse_zero | required=true | status=200 | parse=0 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=play&id=kanbot_1&play=1
- [PASS] play.url.nonempty | required=true | status=200 | url=https://v.lzcdn28.com/20260215/8578_a032d144/2000k/hls/mixed.m3u8 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=play&id=kanbot_1&play=1
- [PASS] play.url.expected_first | required=true | status=200 | expected=https://v.lzcdn28.com/20260215/8578_a032d144/2000k/hls/mixed.m3u8 actual=https://v.lzcdn28.com/20260215/8578_a032d144/2000k/hls/mixed.m3u8 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=play&id=kanbot_1&play=1
- [PASS] play.url.media | required=true | status=200 | url=https://v.lzcdn28.com/20260215/8578_a032d144/2000k/hls/mixed.m3u8 | http://127.0.0.1:5757/ctf-adapter/api/kanbot?pwd=dzyyds&ac=play&id=kanbot_1&play=1
- [PASS] play.url.probe | required=true | status=200 | content-type=application/vnd.apple.mpegurl | https://v.lzcdn28.com/20260215/8578_a032d144/2000k/hls/mixed.m3u8
- [PASS] play.alt.probe | required=false | status=200 | content-type=application/vnd.apple.mpegurl | https://vip.dytt-cinema.com/20260215/49425_d78e4f87/3000k/hls/mixed.m3u8

## 自动探测线路
- 1. ok | status=200 | content-type=application/vnd.apple.mpegurl | https://v.lzcdn28.com/20260215/8578_a032d144/2000k/hls/mixed.m3u8
- 2. ok | status=200 | content-type=application/vnd.apple.mpegurl | https://vip.dytt-cinema.com/20260215/49425_d78e4f87/3000k/hls/mixed.m3u8
- 3. ok | status=200 | content-type=application/vnd.apple.mpegurl | https://cdn.yzzy29-play.com/20260215/20128_9abcd7ad/2000k/hls/mixed.m3u8

## 人工复核
- [ ] 已在客户端导入验证
- [ ] 首页可打开
- [ ] 搜索可命中
- [ ] 分页行为正确
- [ ] 详情可打开
- [ ] 播放可起播
- [ ] 切线可起播
- 备注: