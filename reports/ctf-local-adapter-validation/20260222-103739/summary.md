# ctf_local 全量并发验证汇总

- batch: 20260222-103739
- startedAt: 2026-02-22T02:37:39.126Z
- finishedAt: 2026-02-22T02:37:59.611Z
- port: 5757
- total: 11
- success: 10
- pending: 1
- error: 0

| id | name | status | api_ms | list_ms | detail_ms | play_ms | stream |
|---|---|---|---:|---:|---:|---:|---|
| kvm4 | CTF-4kvm(Local) | success | 9214 | 3 | 2 | 2 | ok |
| cz233 | CTF-cz233(Local) | success | 12223 | 2 | 1 | 2 | ok |
| netflixgc | CTF-netflixgc(Local) | success | 12304 | 2 | 2 | 2 | ok |
| ysxq | CTF-boju(Local) | success | 11598 | 1 | 2 | 2 | ok |
| dbkk | CTF-dbkk(Local) | success | 4550 | 3 | 3 | 2 | ok |
| aiyifan | CTF-aiyifan(Local) | success | 5163 | 2 | 1 | 1 | ok |
| bgm | CTF-bgm(Local) | success | 13208 | 1 | 3 | 2 | ok |
| kuangren | CTF-kuangren(Local) | success | 5355 | 1 | 1 | 1 | ok |
| kanbot | CTF-kanbot(Local) | success | 17712 | 1 | 2 | 3 | ok |
| iyf | CTF-iyf(Local) | success | 5169 | 1 | 1 | 1 | ok |
| libvio | CTF-libvio(Local) | pending | 3903 | 3 | 3 | 3 | fail |

## 结论
- success: 接口链路与首条播放链接探测通过。
- pending: 接口链路通过，但首条播放链接探测失败，需人工播放器终验。
- error: 接口链路存在失败项。