# 外部源内置同步报告

- 时间: 2026-02-23T01:38:56.545Z ~ 2026-02-23T01:38:56.873Z
- workspaceRoot: d:\code\yingshi
- targetRoot: D:\code\yingshi\drpy-node\external\workspace-sources
- apply: 是
- mode: safe-runtime-only
- cleanTarget: 是
- 目录总数: 11
- 成功复制目录: 11
- 缺失目录: 0
- 复制文件数: 36
- 复制体积(MB): 0.3

## 目录详情
- .4kvm.tv: copied, files=1, sizeMB=0, src=d:\code\yingshi\.4kvm.tv, dst=D:\code\yingshi\drpy-node\external\workspace-sources\.4kvm.tv
- .cz233.com: copied, files=1, sizeMB=0.02, src=d:\code\yingshi\.cz233.com, dst=D:\code\yingshi\drpy-node\external\workspace-sources\.cz233.com
- .netflixgc.com: copied, files=1, sizeMB=0.01, src=d:\code\yingshi\.netflixgc.com, dst=D:\code\yingshi\drpy-node\external\workspace-sources\.netflixgc.com
- 播剧影视: copied, files=1, sizeMB=0, src=d:\code\yingshi\播剧影视, dst=D:\code\yingshi\drpy-node\external\workspace-sources\播剧影视
- 独播库: copied, files=16, sizeMB=0.1, src=d:\code\yingshi\独播库, dst=D:\code\yingshi\drpy-node\external\workspace-sources\独播库
- aiyifan: copied, files=6, sizeMB=0.06, src=d:\code\yingshi\aiyifan, dst=D:\code\yingshi\drpy-node\external\workspace-sources\aiyifan
- bgm.girigirilove.com: copied, files=1, sizeMB=0.01, src=d:\code\yingshi\bgm.girigirilove.com, dst=D:\code\yingshi\drpy-node\external\workspace-sources\bgm.girigirilove.com
- kuangren.us: copied, files=2, sizeMB=0, src=d:\code\yingshi\kuangren.us, dst=D:\code\yingshi\drpy-node\external\workspace-sources\kuangren.us
- kanbot.com: copied, files=1, sizeMB=0, src=d:\code\yingshi\kanbot.com, dst=D:\code\yingshi\drpy-node\external\workspace-sources\kanbot.com
- iyf.tv: copied, files=3, sizeMB=0.02, src=d:\code\yingshi\iyf.tv, dst=D:\code\yingshi\drpy-node\external\workspace-sources\iyf.tv
- libvio: copied, files=3, sizeMB=0.05, src=d:\code\yingshi\libvio, dst=D:\code\yingshi\drpy-node\external\workspace-sources\libvio

## 说明
- 该脚本把外部目录镜像到仓库内置目录，供 Docker/GitHub 构建直接使用。
- safe-runtime-only 模式仅复制运行链路所需文件；如需完整镜像可用 --full-copy。
- 已跳过 node_modules/.git 等非必要目录，避免无业务价值的膨胀。
- 已过滤明显敏感文件（如令牌/临时凭据文件），防止凭据泄露到仓库。