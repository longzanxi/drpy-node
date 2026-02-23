# ctf_local 严格全量验证汇总

- batch: 20260223-093947
- startedAt: 2026-02-23T01:39:47.854Z
- finishedAt: 2026-02-23T01:40:09.137Z
- port: 5757
- timeoutMs: 30000
- concurrency: 6
- total: 11
- success: 11
- error: 0
- requiredChecks: 319/319

| id | name | status | required_pass | required_total | first_play_probe |
|---|---|---|---:|---:|---|
| kvm4 | CTF-4kvm(Local) | success | 29 | 29 | ok |
| cz233 | CTF-cz233(Local) | success | 29 | 29 | ok |
| netflixgc | CTF-netflixgc(Local) | success | 29 | 29 | ok |
| ysxq | CTF-boju(Local) | success | 29 | 29 | ok |
| dbkk | CTF-dbkk(Local) | success | 29 | 29 | ok |
| aiyifan | CTF-aiyifan(Local) | success | 29 | 29 | ok |
| bgm | CTF-bgm(Local) | success | 29 | 29 | ok |
| kuangren | CTF-kuangren(Local) | success | 29 | 29 | ok |
| kanbot | CTF-kanbot(Local) | success | 29 | 29 | ok |
| iyf | CTF-iyf(Local) | success | 29 | 29 | ok |
| libvio | CTF-libvio(Local) | success | 29 | 29 | ok |

## 严格判定规则
- 必须通过：home/home(ac=home)/list(pg=1)/list(pg=999)/search正向/search负向/detail正向/detail负向/videolist/play/播放地址探测。
- 任一必选断言失败即判定为 error。