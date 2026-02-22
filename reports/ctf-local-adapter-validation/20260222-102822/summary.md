# ctf_local 全量并发验证汇总

- batch: 20260222-102822
- startedAt: 2026-02-22T02:28:22.764Z
- finishedAt: 2026-02-22T02:28:41.188Z
- port: 5757
- total: 11
- success: 9
- pending: 2
- error: 0

| id | name | status | api_ms | list_ms | detail_ms | play_ms | stream |
|---|---|---|---:|---:|---:|---:|---|
| kvm4 | CTF-4kvm(Local) | success | 12467 | 2 | 3 | 3 | ok |
| cz233 | CTF-cz233(Local) | success | 12218 | 3 | 2 | 3 | ok |
| netflixgc | CTF-netflixgc(Local) | success | 9640 | 3 | 2 | 3 | ok |
| ysxq | CTF-boju(Local) | success | 12538 | 1 | 2 | 2 | ok |
| dbkk | CTF-dbkk(Local) | success | 5536 | 2 | 1 | 2 | ok |
| aiyifan | CTF-aiyifan(Local) | success | 8464 | 1 | 1 | 2 | ok |
| bgm | CTF-bgm(Local) | success | 13344 | 1 | 1 | 1 | ok |
| kuangren | CTF-kuangren(Local) | pending | 5078 | 3 | 2 | 2 | fail |
| kanbot | CTF-kanbot(Local) | success | 15857 | 1 | 1 | 2 | ok |
| iyf | CTF-iyf(Local) | success | 11579 | 1 | 2 | 2 | ok |
| libvio | CTF-libvio(Local) | pending | 4641 | 3 | 3 | 3 | fail |

## 结论
- success: 接口链路与首条播放链接探测通过。
- pending: 接口链路通过，但首条播放链接探测失败，需人工播放器终验。
- error: 接口链路存在失败项。