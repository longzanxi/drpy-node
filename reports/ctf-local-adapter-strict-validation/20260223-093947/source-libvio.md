# ctf_local 严格验证报告 - CTF-libvio(Local)

- id: libvio
- key: ctf_local_libvio
- status: success
- requiredChecks: 29/29
- api: http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds
- searchKeyword: libv
- firstPlayableUrl: https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/playlist.m3u8?ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&fileSize=379963517&isNew=1&et=1771892902259&sign=ck_HdmUMvmRVEC5H3uxkkyi5jVWMwSTzkAE8NktNqBqqcDDXuqPzLq7XXYtsY-yjGfKW0jDN3BDLpwWawbzWjm1_uECer2XjcKl12cI=&ext=eyJ1dCI6MX0%3D&t=4&u=1039841853291957277&ot=personal&f=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&oi=1039841853291957277&X-Amz-Expires=86400&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260223T002822Z&X-Amz-SignedHeaders=host&X-Amz-Credential=Q2PNRN2OGHZQ1ZDF90XQ%2F20260223%2FZGVmYXVsdA%2Fdefault%2Faws4_request&X-Amz-Signature=526dd052ec06929d34af41f322907bf89b5848d257383c2fe352912c90544ee5

## 严格断言结果
- [PASS] home.default.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds
- [PASS] home.default.class | required=true | status=200 | class_len=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds
- [PASS] home.default.list | required=true | status=200 | list_len=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds
- [PASS] home.default.vod | required=true | status=200 | vod_id=libvio_1,play_lines=2 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds
- [PASS] home.ac.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=home
- [PASS] home.ac.same_id | required=true | status=200 | default=libvio_1,ac=libvio_1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=home
- [PASS] list.pg1.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.meta | required=true | status=200 | page=1,limit=1,total=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.size | required=true | status=200 | len=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.same_id | required=true | status=200 | home=libvio_1,list=libvio_1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=list&t=1&pg=1&limit=1
- [PASS] list.pg999.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.clamp | required=true | status=200 | page=1,pagecount=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.size | required=true | status=200 | total=1,len=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=list&t=1&pg=999&limit=1
- [PASS] search.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=search&wd=libv
- [PASS] search.pos.hit | required=true | status=200 | wd=libv,hits=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=search&wd=libv
- [PASS] search.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=search&wd=__strict_not_found_1771810806691_ax7no5
- [PASS] search.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=search&wd=__strict_not_found_1771810806691_ax7no5
- [PASS] detail.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=detail&ids=libvio_1
- [PASS] detail.pos.hit | required=true | status=200 | len=1,id=libvio_1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=detail&ids=libvio_1
- [PASS] detail.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=detail&ids=libvio_1_not_exists
- [PASS] detail.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=detail&ids=libvio_1_not_exists
- [PASS] videolist.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=videolist&ids=libvio_1
- [PASS] videolist.hit | required=true | status=200 | len=1,id=libvio_1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=videolist&ids=libvio_1
- [PASS] play.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=play&id=libvio_1&play=1
- [PASS] play.parse_zero | required=true | status=200 | parse=0 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=play&id=libvio_1&play=1
- [PASS] play.url.nonempty | required=true | status=200 | url=https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/playlist.m3u8?ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&fileSize=37 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=play&id=libvio_1&play=1
- [PASS] play.url.expected_first | required=true | status=200 | expected=https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/playlist.m3u8?ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&fileSize=37 actual=https://wxkdhls.mcloud.139.com/v3/hls/18661 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=play&id=libvio_1&play=1
- [PASS] play.url.media | required=true | status=200 | url=https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/playlist.m3u8?ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&fileSize=37 | http://127.0.0.1:5757/ctf-adapter/api/libvio?pwd=dzyyds&ac=play&id=libvio_1&play=1
- [PASS] play.url.probe | required=true | status=200 | stream_signature_matched | https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/playlist.m3u8?ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&fileSize=379963517&isNew=1&et=1771892902259&sign=ck_HdmUMvmRVEC5H3uxkkyi5jVWMwSTzkAE8NktNqBqqcDDXuqPzLq7XXYtsY-yjGfKW0jDN3BDLpwWawbzWjm1_uECer2XjcKl12cI=&ext=eyJ1dCI6MX0%3D&t=4&u=1039841853291957277&ot=personal&f=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&oi=1039841853291957277&X-Amz-Expires=86400&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260223T002822Z&X-Amz-SignedHeaders=host&X-Amz-Credential=Q2PNRN2OGHZQ1ZDF90XQ%2F20260223%2FZGVmYXVsdA%2Fdefault%2Faws4_request&X-Amz-Signature=526dd052ec06929d34af41f322907bf89b5848d257383c2fe352912c90544ee5
- [PASS] play.alt.probe | required=false | status=200 | stream_signature_matched | https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/1080/index.m3u8?ecc=ck_HdmUMvmRVEC5H3uxkkyi5jVWMwSTzkAk-OEJH5h6jPzjftqL7Na2ZVYpmb-OlH_2dSn5-Ww_XhfE9Nbyavzyt&ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&t=4&u=1039841853291957277&ot=personal&oi=1039841853291957277&f=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&ext=eyJ1dCI6MX0=&X-Amz-Expires=86400&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260223T013958Z&X-Amz-SignedHeaders=host&X-Amz-Credential=Q2PNRN2OGHZQ1ZDF90XQ%2F20260223%2FZGVmYXVsdA%2Fdefault%2Faws4_request&X-Amz-Signature=8477109969e6278402a92a9f18261f31d5ff476a4f2479b8c5816b21c436fb7a&tvkey=m3u8

## 自动探测线路
- 1. ok | status=200 | stream_signature_matched | https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/playlist.m3u8?ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&fileSize=379963517&isNew=1&et=1771892902259&sign=ck_HdmUMvmRVEC5H3uxkkyi5jVWMwSTzkAE8NktNqBqqcDDXuqPzLq7XXYtsY-yjGfKW0jDN3BDLpwWawbzWjm1_uECer2XjcKl12cI=&ext=eyJ1dCI6MX0%3D&t=4&u=1039841853291957277&ot=personal&f=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&oi=1039841853291957277&X-Amz-Expires=86400&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260223T002822Z&X-Amz-SignedHeaders=host&X-Amz-Credential=Q2PNRN2OGHZQ1ZDF90XQ%2F20260223%2FZGVmYXVsdA%2Fdefault%2Faws4_request&X-Amz-Signature=526dd052ec06929d34af41f322907bf89b5848d257383c2fe352912c90544ee5
- 2. ok | status=200 | stream_signature_matched | https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/1080/index.m3u8?ecc=ck_HdmUMvmRVEC5H3uxkkyi5jVWMwSTzkAk-OEJH5h6jPzjftqL7Na2ZVYpmb-OlH_2dSn5-Ww_XhfE9Nbyavzyt&ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&t=4&u=1039841853291957277&ot=personal&oi=1039841853291957277&f=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&ext=eyJ1dCI6MX0=&X-Amz-Expires=86400&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260223T013958Z&X-Amz-SignedHeaders=host&X-Amz-Credential=Q2PNRN2OGHZQ1ZDF90XQ%2F20260223%2FZGVmYXVsdA%2Fdefault%2Faws4_request&X-Amz-Signature=8477109969e6278402a92a9f18261f31d5ff476a4f2479b8c5816b21c436fb7a&tvkey=m3u8

## 人工复核
- [ ] 已在客户端导入验证
- [ ] 首页可打开
- [ ] 搜索可命中
- [ ] 分页行为正确
- [ ] 详情可打开
- [ ] 播放可起播
- [ ] 切线可起播
- 备注: