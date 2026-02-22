# 源验证报告: CTF-4kvm [外部:tvbox]

- key: ext_tvbox_ctf_4kvm_a5f8f6a5
- status: error
- message: 推荐和分类接口均异常
- type/lang: 4/external_1
- api: http://127.0.0.1:7788/api/kvm4
- durationMs: 5

## 测试URL
- home: http://127.0.0.1:7788/api/kvm4
- category: http://127.0.0.1:7788/api/kvm4?ac=list&t=1&pg=1
- search: http://127.0.0.1:7788/api/kvm4?ac=list&wd=%E6%B5%8B%E8%AF%95
- detail: http://127.0.0.1:7788/api/kvm4?ac=detail&ids=1
- play: http://127.0.0.1:7788/api/kvm4?ac=play&id=1&play=1

## 详情
- home: fail | request error: fetch failed | http://127.0.0.1:7788/api/kvm4
- category: fail | request error: fetch failed | http://127.0.0.1:7788/api/kvm4?ac=list&t=1&pg=1
- search: fail | request error: fetch failed | http://127.0.0.1:7788/api/kvm4?ac=list&wd=%E6%B5%8B%E8%AF%95
- detail: fail | request error: fetch failed | http://127.0.0.1:7788/api/kvm4?ac=detail&ids=1
- play: fail | request error: fetch failed | http://127.0.0.1:7788/api/kvm4?ac=play&id=1&play=1

## 人工复核
- [ ] 通过
- [ ] 失败
- 备注: