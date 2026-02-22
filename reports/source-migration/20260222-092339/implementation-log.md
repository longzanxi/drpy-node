# 外部源接入实施记录（批次 20260222-092339）

## 1. 目标
- 将工作区同级目录中的可识别源配置接入 drpy-node。
- 生成可复核的发现清单、接入结果与跳过原因。

## 2. 执行步骤
1. 遍历同级目录，递归扫描 JSON 文件。
2. 识别 sites 结构并提取 name/api/source type。
3. 仅保留 HTTP 源，统一归一化为 type=4。
4. 与已有 link_data 去重合并并写入 data/settings/link_data.json。
5. 写入 config/env.json 的 enable_link_data=1（可关闭）。
6. 输出 summary/discovery/candidates/skipped 报告。

## 3. 关键落盘
- 接入文件: `data/settings/link_data.json`
- 环境开关: `config/env.json`
- 报告目录: `reports/source-migration/20260222-092339`

## 4. 边界
- 纯客户端脚本、加密插件、非HTTP协议不做自动接入。
- 自动检测不等于人工业务验收，人工复核请看后续 source-checker 的 checklist。