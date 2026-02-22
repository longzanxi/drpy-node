# ctf_local 全量并发验证汇总

- batch: 20260222-105007
- startedAt: 2026-02-22T02:50:07.195Z
- finishedAt: 2026-02-22T02:50:46.386Z
- port: 5757
- total: 11
- success: 8
- pending: 0
- error: 3

| id | name | status | api_ms | list_ms | detail_ms | play_ms | stream |
|---|---|---|---:|---:|---:|---:|---|
| kvm4 | CTF-4kvm(Local) | error | 22014 | 7813 | 2 | 1 | ok |
| cz233 | CTF-cz233(Local) | success | 18882 | 2 | 2 | 2 | ok |
| netflixgc | CTF-netflixgc(Local) | success | 18988 | 1 | 2 | 2 | ok |
| ysxq | CTF-boju(Local) | success | 19439 | 1 | 1 | 1 | ok |
| dbkk | CTF-dbkk(Local) | success | 18713 | 12 | 10 | 10 | ok |
| aiyifan | CTF-aiyifan(Local) | error | 22012 | 9112 | 2 | 2 | ok |
| bgm | CTF-bgm(Local) | success | 20718 | 2 | 1 | 1 | ok |
| kuangren | CTF-kuangren(Local) | success | 19804 | 2 | 1 | 1 | ok |
| kanbot | CTF-kanbot(Local) | error | 22013 | 13267 | 1 | 1 | ok |
| iyf | CTF-iyf(Local) | success | 21779 | 2 | 2 | 2 | ok |
| libvio | CTF-libvio(Local) | success | 18963 | 1 | 2 | 3 | ok |

## 结论
- success: 接口链路与首条播放链接探测通过。
- pending: 接口链路通过，但首条播放链接探测失败，需人工播放器终验。
- error: 接口链路存在失败项。