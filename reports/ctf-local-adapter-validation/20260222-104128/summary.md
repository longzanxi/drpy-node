# ctf_local 全量并发验证汇总

- batch: 20260222-104128
- startedAt: 2026-02-22T02:41:28.463Z
- finishedAt: 2026-02-22T02:41:47.063Z
- port: 5757
- total: 11
- success: 10
- pending: 1
- error: 0

| id | name | status | api_ms | list_ms | detail_ms | play_ms | stream |
|---|---|---|---:|---:|---:|---:|---|
| kvm4 | CTF-4kvm(Local) | success | 12612 | 1 | 1 | 2 | ok |
| cz233 | CTF-cz233(Local) | success | 9508 | 2 | 1 | 1 | ok |
| netflixgc | CTF-netflixgc(Local) | success | 12291 | 2 | 1 | 3 | ok |
| ysxq | CTF-boju(Local) | success | 11375 | 2 | 1 | 1 | ok |
| dbkk | CTF-dbkk(Local) | success | 5543 | 2 | 5 | 6 | ok |
| aiyifan | CTF-aiyifan(Local) | success | 11136 | 2 | 2 | 2 | ok |
| bgm | CTF-bgm(Local) | success | 13527 | 1 | 3 | 3 | ok |
| kuangren | CTF-kuangren(Local) | success | 5541 | 2 | 4 | 5 | ok |
| kanbot | CTF-kanbot(Local) | success | 15507 | 3 | 2 | 2 | ok |
| iyf | CTF-iyf(Local) | success | 7738 | 1 | 1 | 2 | ok |
| libvio | CTF-libvio(Local) | pending | 4852 | 3 | 3 | 4 | fail |

## 结论
- success: 接口链路与首条播放链接探测通过。
- pending: 接口链路通过，但首条播放链接探测失败，需人工播放器终验。
- error: 接口链路存在失败项。