# ctf_local 严格验证报告 - CTF-cz233(Local)

- id: cz233
- key: ctf_local_cz233
- status: success
- requiredChecks: 29/29
- api: http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds
- searchKeyword: cz23
- firstPlayableUrl: https://119.91.61.181:906/hls3/hls/%E5%B3%A1%E8%B0%B7.m3u8

## 严格断言结果
- [PASS] home.default.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds
- [PASS] home.default.class | required=true | status=200 | class_len=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds
- [PASS] home.default.list | required=true | status=200 | list_len=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds
- [PASS] home.default.vod | required=true | status=200 | vod_id=cz233_1,play_lines=2 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds
- [PASS] home.ac.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=home
- [PASS] home.ac.same_id | required=true | status=200 | default=cz233_1,ac=cz233_1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=home
- [PASS] list.pg1.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.meta | required=true | status=200 | page=1,limit=1,total=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.size | required=true | status=200 | len=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.same_id | required=true | status=200 | home=cz233_1,list=cz233_1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=list&t=1&pg=1&limit=1
- [PASS] list.pg999.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.clamp | required=true | status=200 | page=1,pagecount=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.size | required=true | status=200 | total=1,len=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=list&t=1&pg=999&limit=1
- [PASS] search.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=search&wd=cz23
- [PASS] search.pos.hit | required=true | status=200 | wd=cz23,hits=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=search&wd=cz23
- [PASS] search.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=search&wd=__strict_not_found_1771810791670_td2msm
- [PASS] search.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=search&wd=__strict_not_found_1771810791670_td2msm
- [PASS] detail.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=detail&ids=cz233_1
- [PASS] detail.pos.hit | required=true | status=200 | len=1,id=cz233_1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=detail&ids=cz233_1
- [PASS] detail.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=detail&ids=cz233_1_not_exists
- [PASS] detail.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=detail&ids=cz233_1_not_exists
- [PASS] videolist.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=videolist&ids=cz233_1
- [PASS] videolist.hit | required=true | status=200 | len=1,id=cz233_1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=videolist&ids=cz233_1
- [PASS] play.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=play&id=cz233_1&play=1
- [PASS] play.parse_zero | required=true | status=200 | parse=0 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=play&id=cz233_1&play=1
- [PASS] play.url.nonempty | required=true | status=200 | url=https://119.91.61.181:906/hls3/hls/%E5%B3%A1%E8%B0%B7.m3u8 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=play&id=cz233_1&play=1
- [PASS] play.url.expected_first | required=true | status=200 | expected=https://119.91.61.181:906/hls3/hls/%E5%B3%A1%E8%B0%B7.m3u8 actual=https://119.91.61.181:906/hls3/hls/%E5%B3%A1%E8%B0%B7.m3u8 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=play&id=cz233_1&play=1
- [PASS] play.url.media | required=true | status=200 | url=https://119.91.61.181:906/hls3/hls/%E5%B3%A1%E8%B0%B7.m3u8 | http://127.0.0.1:5757/ctf-adapter/api/cz233?pwd=dzyyds&ac=play&id=cz233_1&play=1
- [PASS] play.url.probe | required=true | status=200 | content-type=application/vnd.apple.mpegurl | https://119.91.61.181:906/hls3/hls/%E5%B3%A1%E8%B0%B7.m3u8
- [FAIL] play.alt.probe | required=false | status=403 | HTTP 403 | https://v3-cdn-tos.ppxvod.com/89c36eb497ee45088e4c74db8485fef3/69989763/video/tos/cn/tos-cn-v-ec2668/o4ohIX4YUDEdxgdEQR9BfFBkIADbLJ2Nl6KyeA/?fileccc=1.mp4

## 自动探测线路
- 1. ok | status=200 | content-type=application/vnd.apple.mpegurl | https://119.91.61.181:906/hls3/hls/%E5%B3%A1%E8%B0%B7.m3u8
- 2. fail | status=403 | HTTP 403 | https://v3-cdn-tos.ppxvod.com/89c36eb497ee45088e4c74db8485fef3/69989763/video/tos/cn/tos-cn-v-ec2668/o4ohIX4YUDEdxgdEQR9BfFBkIADbLJ2Nl6KyeA/?fileccc=1.mp4

## 人工复核
- [ ] 已在客户端导入验证
- [ ] 首页可打开
- [ ] 搜索可命中
- [ ] 分页行为正确
- [ ] 详情可打开
- [ ] 播放可起播
- [ ] 切线可起播
- 备注: