# ctf_local 全量并发验证汇总

- batch: 20260222-104258
- startedAt: 2026-02-22T02:42:58.069Z
- finishedAt: 2026-02-22T02:43:17.420Z
- port: 5757
- total: 11
- success: 10
- pending: 1
- error: 0

| id | name | status | api_ms | list_ms | detail_ms | play_ms | stream |
|---|---|---|---:|---:|---:|---:|---|
| kvm4 | CTF-4kvm(Local) | success | 12698 | 1 | 1 | 1 | ok |
| cz233 | CTF-cz233(Local) | success | 12180 | 4 | 2 | 3 | ok |
| netflixgc | CTF-netflixgc(Local) | success | 12260 | 2 | 3 | 3 | ok |
| ysxq | CTF-boju(Local) | success | 12715 | 3 | 4 | 3 | ok |
| dbkk | CTF-dbkk(Local) | success | 9095 | 1 | 2 | 3 | ok |
| aiyifan | CTF-aiyifan(Local) | success | 9448 | 3 | 6 | 5 | ok |
| bgm | CTF-bgm(Local) | success | 14404 | 3 | 3 | 4 | ok |
| kuangren | CTF-kuangren(Local) | success | 8586 | 2 | 3 | 2 | ok |
| kanbot | CTF-kanbot(Local) | success | 17274 | 2 | 2 | 2 | ok |
| iyf | CTF-iyf(Local) | success | 9394 | 3 | 3 | 4 | ok |
| libvio | CTF-libvio(Local) | pending | 7317 | 4 | 3 | 3 | fail |

## 结论
- success: 接口链路与首条播放链接探测通过。
- pending: 接口链路通过，但首条播放链接探测失败，需人工播放器终验。
- error: 接口链路存在失败项。