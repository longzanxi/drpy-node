# ctf_local 全量并发验证汇总

- batch: 20260222-100951
- startedAt: 2026-02-22T02:09:51.419Z
- finishedAt: 2026-02-22T02:10:36.087Z
- port: 5757
- total: 11
- success: 7
- pending: 2
- error: 2

| id | name | status | api_ms | list_ms | detail_ms | play_ms | stream |
|---|---|---|---:|---:|---:|---:|---|
| kvm4 | CTF-4kvm(Local) | pending | 12655 | 1 | 2 | 3 | fail |
| cz233 | CTF-cz233(Local) | success | 10783 | 2 | 2 | 2 | ok |
| netflixgc | CTF-netflixgc(Local) | success | 11094 | 3 | 2 | 3 | ok |
| ysxq | CTF-boju(Local) | success | 12540 | 2 | 3 | 3 | ok |
| dbkk | CTF-dbkk(Local) | success | 9183 | 2 | 1 | 3 | ok |
| aiyifan | CTF-aiyifan(Local) | success | 9570 | 1 | 2 | 2 | ok |
| bgm | CTF-bgm(Local) | error | 22002 | 19817 | 2 | 2 | ok |
| kuangren | CTF-kuangren(Local) | success | 6276 | 3 | 5 | 5 | ok |
| kanbot | CTF-kanbot(Local) | error | 22003 | 14583 | 2 | 2 | ok |
| iyf | CTF-iyf(Local) | success | 9390 | 2 | 2 | 2 | ok |
| libvio | CTF-libvio(Local) | pending | 6167 | 6 | 7 | 8 | fail |

## 结论
- success: 接口链路与首条播放链接探测通过。
- pending: 接口链路通过，但首条播放链接探测失败，需人工播放器终验。
- error: 接口链路存在失败项。