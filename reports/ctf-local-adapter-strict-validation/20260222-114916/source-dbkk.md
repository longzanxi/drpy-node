# ctf_local 严格验证报告 - CTF-dbkk(Local)

- id: dbkk
- key: ctf_local_dbkk
- status: success
- requiredChecks: 29/29
- api: http://127.0.0.1:5757/ctf-adapter/api/dbkk
- searchKeyword: dbkk
- firstPlayableUrl: https://cdn.wlcdn99.com:777/86a2ec51/index.m3u8

## 严格断言结果
- [PASS] home.default.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk
- [PASS] home.default.class | required=true | status=200 | class_len=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk
- [PASS] home.default.list | required=true | status=200 | list_len=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk
- [PASS] home.default.vod | required=true | status=200 | vod_id=dbkk_1,play_lines=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk
- [PASS] home.ac.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=home
- [PASS] home.ac.same_id | required=true | status=200 | default=dbkk_1,ac=dbkk_1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=home
- [PASS] list.pg1.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.meta | required=true | status=200 | page=1,limit=1,total=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.size | required=true | status=200 | len=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.same_id | required=true | status=200 | home=dbkk_1,list=dbkk_1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg999.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.clamp | required=true | status=200 | page=1,pagecount=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.size | required=true | status=200 | total=1,len=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=list&t=1&pg=999&limit=1
- [PASS] search.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=search&wd=dbkk
- [PASS] search.pos.hit | required=true | status=200 | wd=dbkk,hits=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=search&wd=dbkk
- [PASS] search.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=search&wd=__strict_not_found_1771732167614_73hi7b
- [PASS] search.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=search&wd=__strict_not_found_1771732167614_73hi7b
- [PASS] detail.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=detail&ids=dbkk_1
- [PASS] detail.pos.hit | required=true | status=200 | len=1,id=dbkk_1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=detail&ids=dbkk_1
- [PASS] detail.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=detail&ids=dbkk_1_not_exists
- [PASS] detail.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=detail&ids=dbkk_1_not_exists
- [PASS] videolist.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=videolist&ids=dbkk_1
- [PASS] videolist.hit | required=true | status=200 | len=1,id=dbkk_1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=videolist&ids=dbkk_1
- [PASS] play.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=play&id=dbkk_1&play=1
- [PASS] play.parse_zero | required=true | status=200 | parse=0 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=play&id=dbkk_1&play=1
- [PASS] play.url.nonempty | required=true | status=200 | url=https://cdn.wlcdn99.com:777/86a2ec51/index.m3u8 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=play&id=dbkk_1&play=1
- [PASS] play.url.expected_first | required=true | status=200 | expected=https://cdn.wlcdn99.com:777/86a2ec51/index.m3u8 actual=https://cdn.wlcdn99.com:777/86a2ec51/index.m3u8 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=play&id=dbkk_1&play=1
- [PASS] play.url.media | required=true | status=200 | url=https://cdn.wlcdn99.com:777/86a2ec51/index.m3u8 | http://127.0.0.1:5757/ctf-adapter/api/dbkk?ac=play&id=dbkk_1&play=1
- [PASS] play.url.probe | required=true | status=200 | content-type=application/vnd.apple.mpegurl | https://cdn.wlcdn99.com:777/86a2ec51/index.m3u8

## 自动探测线路
- 1. ok | status=200 | content-type=application/vnd.apple.mpegurl | https://cdn.wlcdn99.com:777/86a2ec51/index.m3u8

## 人工复核
- [ ] 已在客户端导入验证
- [ ] 首页可打开
- [ ] 搜索可命中
- [ ] 分页行为正确
- [ ] 详情可打开
- [ ] 播放可起播
- [ ] 切线可起播
- 备注: