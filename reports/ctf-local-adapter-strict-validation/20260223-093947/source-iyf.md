# ctf_local 严格验证报告 - CTF-iyf(Local)

- id: iyf
- key: ctf_local_iyf
- status: success
- requiredChecks: 29/29
- api: http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds
- searchKeyword: iyf 
- firstPlayableUrl: https://s1-a1.global-cdn.me/vod/11611D87803-61387.mp4

## 严格断言结果
- [PASS] home.default.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds
- [PASS] home.default.class | required=true | status=200 | class_len=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds
- [PASS] home.default.list | required=true | status=200 | list_len=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds
- [PASS] home.default.vod | required=true | status=200 | vod_id=iyf_1,play_lines=64 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds
- [PASS] home.ac.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=home
- [PASS] home.ac.same_id | required=true | status=200 | default=iyf_1,ac=iyf_1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=home
- [PASS] list.pg1.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.meta | required=true | status=200 | page=1,limit=1,total=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.size | required=true | status=200 | len=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=list&t=1&pg=1&limit=1
- [PASS] list.pg1.same_id | required=true | status=200 | home=iyf_1,list=iyf_1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=list&t=1&pg=1&limit=1
- [PASS] list.pg999.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.clamp | required=true | status=200 | page=1,pagecount=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=list&t=1&pg=999&limit=1
- [PASS] list.pg999.size | required=true | status=200 | total=1,len=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=list&t=1&pg=999&limit=1
- [PASS] search.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=search&wd=iyf+
- [PASS] search.pos.hit | required=true | status=200 | wd=iyf ,hits=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=search&wd=iyf+
- [PASS] search.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=search&wd=__strict_not_found_1771810793640_old2vq
- [PASS] search.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=search&wd=__strict_not_found_1771810793640_old2vq
- [PASS] detail.pos.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=detail&ids=iyf_1
- [PASS] detail.pos.hit | required=true | status=200 | len=1,id=iyf_1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=detail&ids=iyf_1
- [PASS] detail.neg.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=detail&ids=iyf_1_not_exists
- [PASS] detail.neg.empty | required=true | status=200 | total=0,len=0 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=detail&ids=iyf_1_not_exists
- [PASS] videolist.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=videolist&ids=iyf_1
- [PASS] videolist.hit | required=true | status=200 | len=1,id=iyf_1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=videolist&ids=iyf_1
- [PASS] play.code | required=true | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=play&id=iyf_1&play=1
- [PASS] play.parse_zero | required=true | status=200 | parse=0 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=play&id=iyf_1&play=1
- [PASS] play.url.nonempty | required=true | status=200 | url=https://s1-a1.global-cdn.me/vod/11611D87803-61387.mp4 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=play&id=iyf_1&play=1
- [PASS] play.url.expected_first | required=true | status=200 | expected=https://s1-a1.global-cdn.me/vod/11611D87803-61387.mp4 actual=https://s1-a1.global-cdn.me/vod/11611D87803-61387.mp4 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=play&id=iyf_1&play=1
- [PASS] play.url.media | required=true | status=200 | url=https://s1-a1.global-cdn.me/vod/11611D87803-61387.mp4 | http://127.0.0.1:5757/ctf-adapter/api/iyf?pwd=dzyyds&ac=play&id=iyf_1&play=1
- [PASS] play.url.probe | required=true | status=206 | content-type=video/mp4 | https://s1-a1.global-cdn.me/vod/11611D87803-61387.mp4
- [FAIL] play.alt.probe | required=false | status=403 | HTTP 403 | https://global.dudupro.com/s6/ppot/_definst_/mp4:s15/hvod/lxj-sxfysmfsd1j-01-02A6E5551.mp4/chunklist.m3u8?vendtime=1771443205&vhash=HJZHTKucWqyGj-tnSSP8IOh0tv80ySCDcT86kiHn9ls=&vCustomParameter=0_140.245.72.39_KR_1_0_1&lb=5d0a0ac059db525d3aab997940d839ec&us=1&proxy=SpOjPJ4kOsnlTMHcRt9cTMukTcbmV7CsBMKnBcDiRtLaQcyrDvSxDBWz7CsBMKnBcDiRtLaOsytjXSxDBWz7CsBMKnBcDiRtLaSsXbQMukTcbmV7CsBMKnBdHcOcyyM5XOIvZRsD&proxyize=5

## 自动探测线路
- 1. ok | status=206 | content-type=video/mp4 | https://s1-a1.global-cdn.me/vod/11611D87803-61387.mp4
- 2. fail | status=403 | HTTP 403 | https://global.dudupro.com/s6/ppot/_definst_/mp4:s15/hvod/lxj-sxfysmfsd1j-01-02A6E5551.mp4/chunklist.m3u8?vendtime=1771443205&vhash=HJZHTKucWqyGj-tnSSP8IOh0tv80ySCDcT86kiHn9ls=&vCustomParameter=0_140.245.72.39_KR_1_0_1&lb=5d0a0ac059db525d3aab997940d839ec&us=1&proxy=SpOjPJ4kOsnlTMHcRt9cTMukTcbmV7CsBMKnBcDiRtLaQcyrDvSxDBWz7CsBMKnBcDiRtLaOsytjXSxDBWz7CsBMKnBcDiRtLaSsXbQMukTcbmV7CsBMKnBdHcOcyyM5XOIvZRsD&proxyize=5
- 3. ok | status=200 | content-type=application/dash+xml | https://global.dudupro.com/s6/ppot/_definst_/mp4:s15/hvod/lxj-sxfysmfsd1j-01-02A6E5551.mp4/manifest.mpd?vendtime=1771443205&vhash=HJZHTKucWqyGj-tnSSP8IOh0tv80ySCDcT86kiHn9ls=&vCustomParameter=0_140.245.72.39_KR_1_0_1&lb=5d0a0ac059db525d3aab997940d839ec&us=1&proxy=SpOjPJ4kOsnlTMHcRt9cTMukTcbmV7CsBMKnBcDiRtLaQcyrDvSxDBWz7CsBMKnBcDiRtLaOsytjXSxDBWz7CsBMKnBcDiRtLaSsXbQMukTcbmV7CsBMKnBdHcOcyyM5XOIvZRsD&proxyize=5

## 人工复核
- [ ] 已在客户端导入验证
- [ ] 首页可打开
- [ ] 搜索可命中
- [ ] 分页行为正确
- [ ] 详情可打开
- [ ] 播放可起播
- [ ] 切线可起播
- 备注: