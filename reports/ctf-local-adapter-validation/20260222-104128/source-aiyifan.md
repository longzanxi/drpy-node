# ctf_local 验证报告 - CTF-aiyifan(Local)

- id: aiyifan
- key: ctf_local_aiyifan
- status: success
- api: http://127.0.0.1:5757/ctf-adapter/api/aiyifan
- firstPlayableUrl: https://global.dudupro.com/s2/ppot/_definst_/mp4:s17/live/lxj-sxfysmfsd1j-07-03491EA44.mp4/manifest.mpd?vendtime=1771437743&vhash=S-ZF1up3qzTtvCZIepMNfaUYQRV_NONp7r6z3eOd8Bs=&vCustomParameter=0_140.245.72.39_KR_1_0_1&lb=029813cf9d9913c131504effd38518e0&us=1&proxy=Sp8jPJ4kPsLkPN9XR6DaRYvZRsryEPaMifYNDpAxkxoniZSNCRUslZcP5hAObpSokxoxE32NCRUslZcP5hAObpSokxoxE38NCRUslZcP5hAObp2vCh4yNHbBdXvU2&proxyize=5
- streamProbe: ok | content-type=application/dash+xml

## 接口检查
- home: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan
- list: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=list&t=1&pg=1
- search: ok | status=200 | items=0 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=search&wd=test
- detail: ok | status=200 | items=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=detail&ids=aiyifan_1
- play: ok | status=200 | code=1 | http://127.0.0.1:5757/ctf-adapter/api/aiyifan?ac=play&id=aiyifan_1

## 人工复核
- [ ] 在播放器中导入该源并进入详情页
- [ ] 校验首条播放线路可起播且无明显花屏/卡顿
- [ ] 校验切换线路后仍可起播

## 自动探测线路
- 1. ok | status=200 | content-type=application/dash+xml | https://global.dudupro.com/s2/ppot/_definst_/mp4:s17/live/lxj-sxfysmfsd1j-07-03491EA44.mp4/manifest.mpd?vendtime=1771437743&vhash=S-ZF1up3qzTtvCZIepMNfaUYQRV_NONp7r6z3eOd8Bs=&vCustomParameter=0_140.245.72.39_KR_1_0_1&lb=029813cf9d9913c131504effd38518e0&us=1&proxy=Sp8jPJ4kPsLkPN9XR6DaRYvZRsryEPaMifYNDpAxkxoniZSNCRUslZcP5hAObpSokxoxE32NCRUslZcP5hAObpSokxoxE38NCRUslZcP5hAObp2vCh4yNHbBdXvU2&proxyize=5
- 备注: