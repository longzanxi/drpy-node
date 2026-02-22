# ctf_local 全量并发验证汇总

- batch: 20260222-101224
- startedAt: 2026-02-22T02:12:24.814Z
- finishedAt: 2026-02-22T02:12:44.366Z
- port: 5757
- total: 11
- success: 10
- pending: 1
- error: 0

| id | name | status | api_ms | list_ms | detail_ms | play_ms | stream |
|---|---|---|---:|---:|---:|---:|---|
| kvm4 | CTF-4kvm(Local) | success | 10911 | 1 | 1 | 2 | ok |
| cz233 | CTF-cz233(Local) | success | 12197 | 1 | 1 | 2 | ok |
| netflixgc | CTF-netflixgc(Local) | success | 12291 | 2 | 3 | 3 | ok |
| ysxq | CTF-boju(Local) | success | 9041 | 2 | 1 | 1 | ok |
| dbkk | CTF-dbkk(Local) | success | 5908 | 2 | 2 | 1 | ok |
| aiyifan | CTF-aiyifan(Local) | success | 6417 | 2 | 3 | 3 | ok |
| bgm | CTF-bgm(Local) | success | 13037 | 1 | 2 | 1 | ok |
| kuangren | CTF-kuangren(Local) | success | 5500 | 3 | 2 | 3 | ok |
| kanbot | CTF-kanbot(Local) | success | 16252 | 1 | 2 | 3 | ok |
| iyf | CTF-iyf(Local) | success | 6350 | 1 | 1 | 2 | ok |
| libvio | CTF-libvio(Local) | pending | 5162 | 3 | 5 | 6 | fail |

## 结论
- success: 接口链路与首条播放链接探测通过。
- pending: 接口链路通过，但首条播放链接探测失败，需人工播放器终验。
- error: 接口链路存在失败项。