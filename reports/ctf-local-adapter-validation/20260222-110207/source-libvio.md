# ctf_local 验证报告 - CTF-libvio(Local)

- id: libvio
- key: ctf_local_libvio
- status: success
- api: http://127.0.0.1:5757/ctf-adapter/api/libvio
- firstPlayableUrl: https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/playlist.m3u8?ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&fileSize=379963517&isNew=1&et=1771814416166&sign=ck_HdmUMvmRVEC5H3uxkkyi5jVWMwSTzkAk6O0pJqxmlcDDXuqPzLq7XXYtsY-yjGfKW0jDN3BDLpwWawRMi3NfFfylEqJ2fkLifDQQ=&ext=eyJ1dCI6MX0%3D&t=4&u=1039841853291957277&ot=personal&f=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&oi=1039841853291957277&X-Amz-Expires=86400&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260222T024016Z&X-Amz-SignedHeaders=host&X-Amz-Credential=Q2PNRN2OGHZQ1ZDF90XQ%2F20260222%2FZGVmYXVsdA%2Fdefault%2Faws4_request&X-Amz-Signature=0b78fc09de668ef5d1ff37c95c8acec1b46273ed8b9a60b0cd9042d5fad7a9ca
- streamProbe: ok | stream_signature_matched

## 接口检查
- home: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio
- list: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=list&t=1&pg=1
- search: ok | status=200 | items=0 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=search&wd=test
- detail: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=detail&ids=libvio_1
- play: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/libvio?ac=play&id=libvio_1

## 人工复核
- [ ] 在播放器中导入该源并进入详情页
- [ ] 校验首条播放线路可起播且无明显花屏/卡顿
- [ ] 校验切换线路后仍可起播

## 自动探测线路
- 1. ok | status=200 | stream_signature_matched | https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/playlist.m3u8?ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&fileSize=379963517&isNew=1&et=1771814416166&sign=ck_HdmUMvmRVEC5H3uxkkyi5jVWMwSTzkAk6O0pJqxmlcDDXuqPzLq7XXYtsY-yjGfKW0jDN3BDLpwWawRMi3NfFfylEqJ2fkLifDQQ=&ext=eyJ1dCI6MX0%3D&t=4&u=1039841853291957277&ot=personal&f=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&oi=1039841853291957277&X-Amz-Expires=86400&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260222T024016Z&X-Amz-SignedHeaders=host&X-Amz-Credential=Q2PNRN2OGHZQ1ZDF90XQ%2F20260222%2FZGVmYXVsdA%2Fdefault%2Faws4_request&X-Amz-Signature=0b78fc09de668ef5d1ff37c95c8acec1b46273ed8b9a60b0cd9042d5fad7a9ca
- 备注: