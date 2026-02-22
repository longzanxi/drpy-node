# ctf_local 验证报告 - CTF-iyf(Local)

- id: iyf
- key: ctf_local_iyf
- status: success
- api: http://127.0.0.1:5757/ctf-adapter/api/iyf
- firstPlayableUrl: https://global.dudupro.com/s6/ppot/_definst_/mp4:s15/hvod/lxj-sxfysmfsd1j-01-02A6E5551.mp4/manifest.mpd?vendtime=1771443205&vhash=HJZHTKucWqyGj-tnSSP8IOh0tv80ySCDcT86kiHn9ls=&vCustomParameter=0_140.245.72.39_KR_1_0_1&lb=5d0a0ac059db525d3aab997940d839ec&us=1&proxy=SpOjPJ4kOsnlTMHcRt9cTMukTcbmV7CsBMKnBcDiRtLaQcyrDvSxDBWz7CsBMKnBcDiRtLaOsytjXSxDBWz7CsBMKnBcDiRtLaSsXbQMukTcbmV7CsBMKnBdHcOcyyM5XOIvZRsD&proxyize=5
- streamProbe: ok | content-type=application/dash+xml

## 接口检查
- home: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf
- list: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?ac=list&t=1&pg=1
- search: ok | status=200 | items=0 | http://127.0.0.1:5757/ctf-adapter/api/iyf?ac=search&wd=test
- detail: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?ac=detail&ids=iyf_1
- play: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/iyf?ac=play&id=iyf_1

## 人工复核
- [ ] 在播放器中导入该源并进入详情页
- [ ] 校验首条播放线路可起播且无明显花屏/卡顿
- [ ] 校验切换线路后仍可起播

## 自动探测线路
- 1. ok | status=200 | content-type=application/dash+xml | https://global.dudupro.com/s6/ppot/_definst_/mp4:s15/hvod/lxj-sxfysmfsd1j-01-02A6E5551.mp4/manifest.mpd?vendtime=1771443205&vhash=HJZHTKucWqyGj-tnSSP8IOh0tv80ySCDcT86kiHn9ls=&vCustomParameter=0_140.245.72.39_KR_1_0_1&lb=5d0a0ac059db525d3aab997940d839ec&us=1&proxy=SpOjPJ4kOsnlTMHcRt9cTMukTcbmV7CsBMKnBcDiRtLaQcyrDvSxDBWz7CsBMKnBcDiRtLaOsytjXSxDBWz7CsBMKnBcDiRtLaSsXbQMukTcbmV7CsBMKnBdHcOcyyM5XOIvZRsD&proxyize=5
- 备注: