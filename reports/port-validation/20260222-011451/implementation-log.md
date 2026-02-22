# drpy-node 全端口接入实施记录

## 1. 目标
- 覆盖主服务端口 `5757`、WS 端口 `57575`、Python daemon 端口 `57570`、插件端口 `57571-57574`。
- 对每个端口进行实际连通/接口验证并落盘证据。
- 生成可复核的原始数据与分端口深度报告。

## 2. 首轮问题
- daemon 启动失败，`57570` 未监听，导致 `PY依赖测试` 失败。
- 根因1：环境缺少 Python 依赖 `ujson`，`t4_daemon.py` 启动报错。
- 根因2：健康接口工具函数 `createHealthResponse` 与控制器调用参数顺序不一致，部分 `/health` 返回 500。

## 3. 修复动作
- 安装 Python 依赖：`python -m pip install ujson`。
- 修复 `utils/proxy-util.js`：
  - `createHealthResponse` 兼容两类调用签名：
    - `createHealthResponse('Service', requestCache, additionalCache)`
    - `createHealthResponse(requestCache, additionalCache, { features })`
  - 规避将缓存对象误写入 `service` 字段造成循环引用序列化错误。
- 完善 `scripts/test/full-port-validation.mjs`：
  - 增加 Python 可执行路径探测并透传 `PYTHON_PATH`。
  - 固化端口测试矩阵、断言规则与报告生成。
  - 输出 `raw-results.json + 分端口 md + summary.md + server 日志`。

## 4. 最终结果
- 成功报告目录：`reports/port-validation/20260222-011451`
- 总用例：`45`
- 失败：`0`
- 端口结论：
  - `5757`：PASS（37/37）
  - `57575`：PASS（2/2）
  - `57570`：PASS（2/2）
  - `57571`：PASS（1/1，未激活端口按预期不监听）
  - `57572`：PASS（1/1，未激活端口按预期不监听）
  - `57573`：PASS（1/1，未激活端口按预期不监听）
  - `57574`：PASS（1/1，未激活端口按预期不监听）

## 5. 审计文件
- `reports/port-validation/20260222-011451/raw-results.json`
- `reports/port-validation/20260222-011451/summary.md`
- `reports/port-validation/20260222-011451/port-5757.md`
- `reports/port-validation/20260222-011451/port-57570.md`
- `reports/port-validation/20260222-011451/port-57571.md`
- `reports/port-validation/20260222-011451/port-57572.md`
- `reports/port-validation/20260222-011451/port-57573.md`
- `reports/port-validation/20260222-011451/port-57574.md`
- `reports/port-validation/20260222-011451/port-57575.md`
- `reports/port-validation/20260222-011451/server.stdout.log`
- `reports/port-validation/20260222-011451/server.stderr.log`

