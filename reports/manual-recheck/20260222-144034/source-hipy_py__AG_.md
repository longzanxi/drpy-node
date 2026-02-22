# 人工复验报告 - 五八[AG¹](hipy)

- key: hipy_py_五八[AG¹]
- module: AppGet
- status: fail
- failed: 1

## 步骤结果
- home: PASS | status=200 | class=3,list=63 | http://127.0.0.1:5757/api/AppGet?do=py&extend=%7B%22host%22%3A%22https%3A%2F%2Fdy.58ys.vip%22%2C%22key%22%3A%22JEWibY1AgWF0V1xx%22%7D
- list: PASS | status=200 | items=30 | http://127.0.0.1:5757/api/AppGet?do=py&extend=%7B%22host%22%3A%22https%3A%2F%2Fdy.58ys.vip%22%2C%22key%22%3A%22JEWibY1AgWF0V1xx%22%7D&ac=list&t=1&pg=1
- search: FAIL | status=500 | wd=船长二世,items=0 | http://127.0.0.1:5757/api/AppGet?do=py&extend=%7B%22host%22%3A%22https%3A%2F%2Fdy.58ys.vip%22%2C%22key%22%3A%22JEWibY1AgWF0V1xx%22%7D&wd=%E8%88%B9%E9%95%BF%E4%BA%8C%E4%B8%96&pg=1
- detail: PASS | status=200 | items=1 | http://127.0.0.1:5757/api/AppGet?do=py&extend=%7B%22host%22%3A%22https%3A%2F%2Fdy.58ys.vip%22%2C%22key%22%3A%22JEWibY1AgWF0V1xx%22%7D&ac=detail&ids=43
- play: PASS | status=200 | parse=0,url=https://vip.dytt-live.com/20250420/4453_fd95ec8d/index.m3u8 | http://127.0.0.1:5757/api/AppGet?do=py&extend=%7B%22host%22%3A%22https%3A%2F%2Fdy.58ys.vip%22%2C%22key%22%3A%22JEWibY1AgWF0V1xx%22%7D&play=eyJuYW1lIjogIkhEXHU0ZTJkXHU1YjU3IiwgInVybCI6ICJodHRwczovL3ZpcC5keXR0LWxpdmUuY29tLzIwMjUwNDIwLzQ0NTNfZmQ5NWVjOGQvaW5kZXgubTN1OCIsICJmcm9tIjogImR5dHRtM3U4IiwgIm5pZCI6IDEsICJ0b2tlbiI6ICIiLCAicGFyc2VfYXBpX3VybCI6ICJodHRwczovL2pzb24ua2UtbWkudmlwLz91cmw9aHR0cHM6Ly92aXAuZHl0dC1saXZlLmNvbS8yMDI1MDQyMC80NDUzX2ZkOTVlYzhkL2luZGV4Lm0zdTgiLCAidmlkIjogIjQzIiwgInVzZXJfYWdlbnQiOiAiIiwgInBhcnNlIjogImh0dHBzOi8vanNvbi5rZS1taS52aXAvP3VybD0ifQ%3D%3D&flag=%F0%9F%94%A5%E6%8E%A8%E8%8D%90
- play_probe: PASS | status=200 | ok | https://vip.dytt-live.com/20250420/4453_fd95ec8d/index.m3u8

## 人工结论
- [ ] 保留
- [ ] 删除
- 备注: