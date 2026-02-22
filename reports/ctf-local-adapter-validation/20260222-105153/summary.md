# ctf_local 全量并发验证汇总

- batch: 20260222-105153
- startedAt: 2026-02-22T02:51:53.394Z
- finishedAt: 2026-02-22T02:52:33.038Z
- port: 5757
- total: 11
- success: 11
- pending: 0
- error: 0

| id | name | status | api_ms | list_ms | detail_ms | play_ms | stream |
|---|---|---|---:|---:|---:|---:|---|
| kvm4 | CTF-4kvm(Local) | success | 5861 | 3 | 5 | 6 | ok |
| cz233 | CTF-cz233(Local) | success | 12193 | 2 | 3 | 4 | ok |
| netflixgc | CTF-netflixgc(Local) | success | 9337 | 2 | 3 | 4 | ok |
| ysxq | CTF-boju(Local) | success | 5006 | 4 | 4 | 4 | ok |
| dbkk | CTF-dbkk(Local) | success | 1051 | 4 | 5 | 5 | ok |
| aiyifan | CTF-aiyifan(Local) | success | 1469 | 3 | 2 | 3 | ok |
| bgm | CTF-bgm(Local) | success | 24492 | 2 | 1 | 2 | ok |
| kuangren | CTF-kuangren(Local) | success | 2864 | 2 | 2 | 2 | ok |
| kanbot | CTF-kanbot(Local) | success | 25787 | 1 | 2 | 1 | ok |
| iyf | CTF-iyf(Local) | success | 360 | 2 | 5 | 5 | ok |
| libvio | CTF-libvio(Local) | success | 19266 | 3 | 4 | 4 | ok |

## 结论
- success: 接口链路与首条播放链接探测通过。
- pending: 接口链路通过，但首条播放链接探测失败，需人工播放器终验。
- error: 接口链路存在失败项。