# ctf_local 严格验证报告 - CTF-libvio(Local)

- id: libvio
- key: ctf_local_libvio
- status: success
- requiredChecks: 29/29
- api: http://127.0.0.1:5757/ctf-adapter/api/libvio
- searchKeyword: libv
- firstPlayableUrl: https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/playlist.m3u8?ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&fileSize=379963517&isNew=1&et=1771814416166&sign=ck_HdmUMvmRVEC5H3uxkkyi5jVWMwSTzkAk6O0pJqxmlcDDXuqPzLq7XXYtsY-yjGfKW0jDN3BDLpwWawRMi3NfFfylEqJ2fkLifDQQ=&ext=eyJ1dCI6MX0%3D&t=4&u=1039841853291957277&ot=personal&f=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&oi=1039841853291957277&X-Amz-Expires=86400&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260222T024016Z&X-Amz-SignedHeaders=host&X-Amz-Credential=Q2PNRN2OGHZQ1ZDF90XQ%2F20260222%2FZGVmYXVsdA%2Fdefault%2Faws4_request&X-Amz-Signature=0b78fc09de668ef5d1ff37c95c8acec1b46273ed8b9a60b0cd9042d5fad7a9ca

## 严格断言结果
- [PASS] home.default.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio
- [PASS] home.default.class | required=true | status=200 | class_len=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio
- [PASS] home.default.list | required=true | status=200 | list_len=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio
- [PASS] home.default.vod | required=true | status=200 | vod_id=libvio_1,play_lines=2 | http://127.0.0.1:5757/ctf-adapter/api/libvio
- [PASS] home.ac.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=home
- [PASS] home.ac.same_id | required=true | status=200 | default=libvio_1,ac=libvio_1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=home
- [PASS] list.pg1.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.meta | required=true | status=200 | page=1,limit=1,total=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.size | required=true | status=200 | len=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.same_id | required=true | status=200 | home=libvio_1,list=libvio_1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=list&t=1&pg=1&limit=1
- [PASS] list.pg999.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.clamp | required=true | status=200 | page=1,pagecount=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.size | required=true | status=200 | total=1,len=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=list&t=1&pg=999&limit=1
- [PASS] search.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=search&wd=libv
- [PASS] search.pos.hit | required=true | status=200 | wd=libv,hits=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=search&wd=libv
- [PASS] search.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=search&wd=__strict_not_found_1771732144577_t39oka
- [PASS] search.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=search&wd=__strict_not_found_1771732144577_t39oka
- [PASS] detail.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=detail&ids=libvio_1
- [PASS] detail.pos.hit | required=true | status=200 | len=1,id=libvio_1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=detail&ids=libvio_1
- [PASS] detail.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=detail&ids=libvio_1_not_exists
- [PASS] detail.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=detail&ids=libvio_1_not_exists
- [PASS] videolist.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=videolist&ids=libvio_1
- [PASS] videolist.hit | required=true | status=200 | len=1,id=libvio_1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=videolist&ids=libvio_1
- [PASS] play.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=play&id=libvio_1&play=1
- [PASS] play.parse_zero | required=true | status=200 | parse=0 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=play&id=libvio_1&play=1
- [PASS] play.url.nonempty | required=true | status=200 | url=https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/playlist.m3u8?ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&fileSize=37 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=play&id=libvio_1&play=1
- [PASS] play.url.expected_first | required=true | status=200 | expected=https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/playlist.m3u8?ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&fileSize=37 actual=https://wxkdhls.mcloud.139.com/v3/hls/18661 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=play&id=libvio_1&play=1
- [PASS] play.url.media | required=true | status=200 | url=https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/playlist.m3u8?ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&fileSize=37 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=play&id=libvio_1&play=1
- [PASS] play.url.probe | required=true | status=200 | stream_signature_matched | https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/playlist.m3u8?ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&fileSize=379963517&isNew=1&et=1771814416166&sign=ck_HdmUMvmRVEC5H3uxkkyi5jVWMwSTzkAk6O0pJqxmlcDDXuqPzLq7XXYtsY-yjGfKW0jDN3BDLpwWawRMi3NfFfylEqJ2fkLifDQQ=&ext=eyJ1dCI6MX0%3D&t=4&u=1039841853291957277&ot=personal&f=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&oi=1039841853291957277&X-Amz-Expires=86400&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260222T024016Z&X-Amz-SignedHeaders=host&X-Amz-Credential=Q2PNRN2OGHZQ1ZDF90XQ%2F20260222%2FZGVmYXVsdA%2Fdefault%2Faws4_request&X-Amz-Signature=0b78fc09de668ef5d1ff37c95c8acec1b46273ed8b9a60b0cd9042d5fad7a9ca
- [PASS] play.alt.probe | required=false | status=200 | stream_signature_matched | https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/1080/index.m3u8?ecc=ck_HdmUMvmRVEC5H3uxkkyi5jVWMwSTznws8Pk5M5h6jPzjftqL7Na2ZVYpmb-OlH_2nQJDvtbJeqkkwzzLq7p3P&ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&t=4&u=1039841853291957277&ot=personal&oi=1039841853291957277&f=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&ext=eyJ1dCI6MX0=&X-Amz-Expires=86400&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260222T034913Z&X-Amz-SignedHeaders=host&X-Amz-Credential=Q2PNRN2OGHZQ1ZDF90XQ%2F20260222%2FZGVmYXVsdA%2Fdefault%2Faws4_request&X-Amz-Signature=b690862c27068afa65ccc1108a4f4e86ee05d27de6cef8d4508e58dde118abcf&tvkey=m3u8

## 自动探测线路
- 1. ok | status=200 | stream_signature_matched | https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/playlist.m3u8?ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&fileSize=379963517&isNew=1&et=1771814416166&sign=ck_HdmUMvmRVEC5H3uxkkyi5jVWMwSTzkAk6O0pJqxmlcDDXuqPzLq7XXYtsY-yjGfKW0jDN3BDLpwWawRMi3NfFfylEqJ2fkLifDQQ=&ext=eyJ1dCI6MX0%3D&t=4&u=1039841853291957277&ot=personal&f=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&oi=1039841853291957277&X-Amz-Expires=86400&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260222T024016Z&X-Amz-SignedHeaders=host&X-Amz-Credential=Q2PNRN2OGHZQ1ZDF90XQ%2F20260222%2FZGVmYXVsdA%2Fdefault%2Faws4_request&X-Amz-Signature=0b78fc09de668ef5d1ff37c95c8acec1b46273ed8b9a60b0cd9042d5fad7a9ca
- 2. ok | status=200 | stream_signature_matched | https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/1080/index.m3u8?ecc=ck_HdmUMvmRVEC5H3uxkkyi5jVWMwSTznws8Pk5M5h6jPzjftqL7Na2ZVYpmb-OlH_2nQJDvtbJeqkkwzzLq7p3P&ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&t=4&u=1039841853291957277&ot=personal&oi=1039841853291957277&f=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&ext=eyJ1dCI6MX0=&X-Amz-Expires=86400&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260222T034913Z&X-Amz-SignedHeaders=host&X-Amz-Credential=Q2PNRN2OGHZQ1ZDF90XQ%2F20260222%2FZGVmYXVsdA%2Fdefault%2Faws4_request&X-Amz-Signature=b690862c27068afa65ccc1108a4f4e86ee05d27de6cef8d4508e58dde118abcf&tvkey=m3u8

## 人工复核
- [ ] 已在客户端导入验证
- [ ] 首页可打开
- [ ] 搜索可命中
- [ ] 分页行为正确
- [ ] 详情可打开
- [ ] 播放可起播
- [ ] 切线可起播
- 备注: