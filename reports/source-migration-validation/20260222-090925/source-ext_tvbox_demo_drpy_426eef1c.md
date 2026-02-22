# 源验证报告: 同构Demo源 [外部:tvbox]

- key: ext_tvbox_demo_drpy_426eef1c
- status: error
- message: 推荐和分类接口均异常
- type/lang: 4/external_3
- api: http://127.0.0.1:9977/js/lib/drpy2.min.js
- durationMs: 7

## 测试URL
- home: http://127.0.0.1:9977/js/lib/drpy2.min.js?extend=http%3A%2F%2F127.0.0.1%3A9977%2Fjs%2Fdemo_source.js
- category: http://127.0.0.1:9977/js/lib/drpy2.min.js?ac=list&t=1&pg=1&extend=http%3A%2F%2F127.0.0.1%3A9977%2Fjs%2Fdemo_source.js
- search: http://127.0.0.1:9977/js/lib/drpy2.min.js?ac=list&wd=%E6%B5%8B%E8%AF%95&extend=http%3A%2F%2F127.0.0.1%3A9977%2Fjs%2Fdemo_source.js
- detail: http://127.0.0.1:9977/js/lib/drpy2.min.js?ac=detail&ids=1&extend=http%3A%2F%2F127.0.0.1%3A9977%2Fjs%2Fdemo_source.js
- play: http://127.0.0.1:9977/js/lib/drpy2.min.js?ac=play&id=1&play=1&extend=http%3A%2F%2F127.0.0.1%3A9977%2Fjs%2Fdemo_source.js

## 详情
- home: fail | request error: fetch failed | http://127.0.0.1:9977/js/lib/drpy2.min.js?extend=http%3A%2F%2F127.0.0.1%3A9977%2Fjs%2Fdemo_source.js
- category: fail | request error: fetch failed | http://127.0.0.1:9977/js/lib/drpy2.min.js?ac=list&t=1&pg=1&extend=http%3A%2F%2F127.0.0.1%3A9977%2Fjs%2Fdemo_source.js
- search: fail | request error: fetch failed | http://127.0.0.1:9977/js/lib/drpy2.min.js?ac=list&wd=%E6%B5%8B%E8%AF%95&extend=http%3A%2F%2F127.0.0.1%3A9977%2Fjs%2Fdemo_source.js
- detail: fail | request error: fetch failed | http://127.0.0.1:9977/js/lib/drpy2.min.js?ac=detail&ids=1&extend=http%3A%2F%2F127.0.0.1%3A9977%2Fjs%2Fdemo_source.js
- play: fail | request error: fetch failed | http://127.0.0.1:9977/js/lib/drpy2.min.js?ac=play&id=1&play=1&extend=http%3A%2F%2F127.0.0.1%3A9977%2Fjs%2Fdemo_source.js

## 人工复核
- [ ] 通过
- [ ] 失败
- 备注: