# ctf_local 验证报告 - CTF-libvio(Local)

- id: libvio
- key: ctf_local_libvio
- status: pending
- api: http://127.0.0.1:5757/ctf-adapter/api/libvio
- firstPlayableUrl: https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/1080/index.m3u8?ecc=ck_HdmUMvmRVEC5H3uxkkyi5jVWMwSTzngk-P0lG5h6jPzjftqL7Na2ZVYpmb-OlH_0miMnQBMYfAnNL2WEN1GES&ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&t=4&u=1039841853291957277&ot=personal&oi=1039841853291957277&f=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&ext=eyJ1dCI6MX0=&X-Amz-Expires=86400&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260220T175349Z&X-Amz-SignedHeaders=host&X-Amz-Credential=Q2PNRN2OGHZQ1ZDF90XQ%2F20260221%2FZGVmYXVsdA%2Fdefault%2Faws4_request&X-Amz-Signature=2cda89f94ad1341d5ec1e22a50d354da2d9bea851d6dd0a8f4f9d3756daff18a&tvkey=m3u8
- streamProbe: fail | HTTP 403

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
- 1. fail | status=403 | HTTP 403 | https://wxkdhls.mcloud.139.com/v3/hls/1866184771348994688/1080/index.m3u8?ecc=ck_HdmUMvmRVEC5H3uxkkyi5jVWMwSTzngk-P0lG5h6jPzjftqL7Na2ZVYpmb-OlH_0miMnQBMYfAnNL2WEN1GES&ci=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&t=4&u=1039841853291957277&ot=personal&oi=1039841853291957277&f=Ft0_uLy7ZRPiYVts78PJJQqMLGiAOWUv4&ext=eyJ1dCI6MX0=&X-Amz-Expires=86400&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260220T175349Z&X-Amz-SignedHeaders=host&X-Amz-Credential=Q2PNRN2OGHZQ1ZDF90XQ%2F20260221%2FZGVmYXVsdA%2Fdefault%2Faws4_request&X-Amz-Signature=2cda89f94ad1341d5ec1e22a50d354da2d9bea851d6dd0a8f4f9d3756daff18a&tvkey=m3u8
- 备注: