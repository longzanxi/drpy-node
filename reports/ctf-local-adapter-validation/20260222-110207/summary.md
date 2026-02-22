# ctf_local 全量并发验证汇总

- batch: 20260222-110207
- startedAt: 2026-02-22T03:02:07.975Z
- finishedAt: 2026-02-22T03:02:47.772Z
- port: 5757
- total: 11
- success: 11
- pending: 0
- error: 0

| id | name | status | api_ms | list_ms | detail_ms | play_ms | stream |
|---|---|---|---:|---:|---:|---:|---|
| kvm4 | CTF-4kvm(Local) | success | 5186 | 8 | 3 | 3 | ok |
| cz233 | CTF-cz233(Local) | success | 12247 | 2 | 3 | 3 | ok |
| netflixgc | CTF-netflixgc(Local) | success | 10134 | 8 | 7 | 9 | ok |
| ysxq | CTF-boju(Local) | success | 4460 | 3 | 4 | 13 | ok |
| dbkk | CTF-dbkk(Local) | success | 770 | 2 | 3 | 4 | ok |
| aiyifan | CTF-aiyifan(Local) | success | 1799 | 1 | 2 | 3 | ok |
| bgm | CTF-bgm(Local) | success | 24818 | 1 | 3 | 3 | ok |
| kuangren | CTF-kuangren(Local) | success | 3398 | 3 | 5 | 4 | ok |
| kanbot | CTF-kanbot(Local) | success | 24566 | 2 | 5 | 7 | ok |
| iyf | CTF-iyf(Local) | success | 20161 | 1 | 3 | 2 | ok |
| libvio | CTF-libvio(Local) | success | 19016 | 3 | 4 | 8 | ok |

## 结论
- success: 接口链路与首条播放链接探测通过。
- pending: 接口链路通过，但首条播放链接探测失败，需人工播放器终验。
- error: 接口链路存在失败项。