# drpy-node 工作原理详解报告

- 报告目标：解释 `drpy-node` 在生产运行时是如何启动、路由、执行规则、转发代理与管理多语言引擎的。
- 分析范围：`d:/code/yingshi/drpy-node` 当前代码（Node 主服务 + JS/DR2/Python/PHP/CatVod 适配层 + 代理体系 + 配置中心 + Python 守护进程）。
- 结论先行：`drpy-node` 的本质是一个“多引擎规则执行网关 + 动态配置编排器”，通过统一 API 把不同格式的源（JS/DR2/PY/PHP/CAT）抽象成同一组能力（home/category/detail/search/play/proxy/action）。

---

## 1. 系统全景（架构视角）

```text
客户端(壳子/播放器/订阅器)
        |
        v
 Fastify 主服务(:5757)  <->  WebSocket 服务(:57575)
        |
        +-- /config*  动态生成配置(站点+解析+直播+播放器)
        +-- /api/:module 统一业务接口(home/category/detail/search/play/action)
        +-- /proxy/:module/* 源内代理回调
        +-- /parse/:jx 解析器入口
        +-- /mediaProxy /m3u8-proxy /unified-proxy /file-proxy /webdav /ftp
        |
        v
  引擎适配层(getApiEngine)
   - drpyS(JS/DS)
   - hipy(Python)
   - php(PHP)
   - catvod(CAT)
   - xbpq(JSON)
        |
        v
  规则执行层
   - VM 沙箱(drpyS)
   - Python 守护进程 RPC(t4_daemon)
   - PHP bridge(_bridge.php)
   - ESM 动态导入(catvod)
```

业务价值：
- 对上游客户端暴露统一协议，减少接入成本。
- 对下游规则实现保留异构能力（JS/PY/PHP/CAT），提升生态兼容性。
- 配置中心按请求动态组装，支持订阅过滤、健康过滤、灰度切换。

---

## 2. 启动链路（从进程到可服务）

核心入口：`index.js`

### 2.1 进程初始化
- 初始化日志与 Fastify 实例：`controllers/fastlogger.js`
- 注册 ESM 钩子：`utils/esm-register.mjs`
- 计算目录与运行参数（`jsDir/pyDir/catDir/...`、`PORT=5757`、`WsPORT=57575`）
- 异步启动插件进程：`startAllPlugins(__dirname)`（不阻塞主线程）

### 2.2 服务就绪 Hook
- `onReady` 中执行：
1. `checkPhpAvailable()` 检查 PHP 能力
2. 启动 Python 守护进程 `daemon.startDaemon()`

### 2.3 中间件 Hook
- `preHandler`：
1. `/apps/*` 走 BasicAuth
2. `/js/*`、`/py/*` 走 `validatePwd`，并对 JS 响应做头注释处理
- `onRequest`：使用 `qs.parse` 重写 query 解析，避免重复参数被转数组影响规则逻辑

### 2.4 路由注册
- 统一在 `controllers/index.js` 注册控制器
- 主服务与 WebSocket 服务分别注册

### 2.5 监听与优雅退出
- 主服务 `fastify.listen({port:5757})`
- WebSocket 服务 `wsApp.listen({port:57575})`
- 监听 `SIGINT/SIGTERM/SIGUSR2`：停止 daemon + 关闭 ws + 关闭 fastify + 回收插件进程

---

## 3. 路由分层与职责

路由装配中心：`controllers/index.js`

主要控制器职责：
- `controllers/api.js`：核心业务 API（最关键）
- `controllers/config.js`：动态配置中心
- `controllers/static.js`：静态资源挂载（`/public`、`/apps`、`/json`、`/js`、`/py`、`/cat`...）
- `controllers/root.js`：根页、`/health`、cat 入口页
- `controllers/mediaProxy.js`：媒体流分段转发
- `controllers/m3u8-proxy.js`：M3U8/TS 专项代理
- `controllers/unified-proxy.js`：智能代理（自动识别 m3u8/file）
- `controllers/cron-tasker.js`：定时任务调度
- `controllers/websocket.js`：实时日志与广播 WebSocket

---

## 4. 核心 API 调度（/api /proxy /parse）

核心文件：`controllers/api.js`

### 4.1 引擎选择
`getApiEngine(engines, moduleName, query, options)`（`utils/api_helper.js`）按 `query.do` 路由：
- `do=py` -> `libs/hipy.js`
- `do=php` -> `libs/php.js`
- `do=cat` -> `libs/catvod.js`
- `do=xbpq` -> `libs/xbpq.js`
- 默认 -> `libs/drpyS.js`

### 4.2 统一环境对象 env
每次请求动态构建：
- `requestHost/proxyUrl/publicUrl/jsonUrl/httpUrl/imageApi`
- `mediaProxyUrl/webdavProxyUrl/ftpProxyUrl`
- `getProxyUrl()`
- `ext`（透传扩展参数）
- `getRule()`（支持规则内跨模块调用）

### 4.3 /api/:module 分发逻辑
根据 query 走不同方法：
1. `play` -> `apiEngine.play`
2. `ac+t` -> `apiEngine.category`
3. `ac+ids` -> `apiEngine.detail`
4. `ac+action` -> `apiEngine.action`
5. `wd` -> `apiEngine.search`
6. `refresh` -> `apiEngine.init(..., true)`
7. 默认 -> `home + homeVod` 合并输出

并通过 `withTimeout` 做超时保护：
- 普通接口默认 `API_TIMEOUT`（默认 20s）
- action 接口默认 `API_ACTION_TIMEOUT`（默认 60s）

### 4.4 /proxy/:module/*
- 调用 `apiEngine.proxy` 返回 `[status, mediaType, content, headers, toBytes]`
- `toBytes===1`：按 base64 转二进制回传
- `toBytes===2 && content为http`：重定向到 `/mediaProxy`

### 4.5 /parse/:jx
- 使用 `drpyS.jx(jxPath, env, query)` 执行解析器
- 统一包装返回 `code/msg/cost`

---

## 5. drpyS 引擎（最核心执行器）

核心文件：`libs/drpyS.js`

### 5.1 三层核心能力
1. 沙箱构建：`getSandbox(env)`
2. 规则加载：`init(filePath, env, refresh)`
3. 方法调用：`invokeMethod(..., method='推荐/一级/二级/搜索/lazy/...')`

### 5.2 沙箱注入
注入大量能力到 VM：
- 抓取与解析：`request/req/pdfh/pdfa/pd/jsoup/...`
- 工具与加密：`CryptoJS/RSA/gzip/ungzip/jsEncoder/...`
- 业务能力：`ENV/cookie/database/webdav/ftp/pans`
- 批量请求、OCR、模板工具等

特点：
- 规则执行隔离在 `vm.createContext` 内
- 再注入 `es6_extend_code` 与 `req_extend_code`

### 5.3 规则初始化流程
`init` 内关键步骤：
1. 读取文件 + hash
2. 缓存命中校验（`moduleCache`）
3. 执行规则代码，提取 `rule`
4. `handleTemplateInheritance(rule, context)` 模板继承/自动模板
5. `initParse(rule, env, vm, context)` 归一化规则字段
6. 挂载 `context` 回规则对象并缓存

### 5.4 方法执行策略
`invokeMethod` 会根据规则字段类型分流：
- 方法是函数 -> 直接调用
- 方法是 `js:` 字符串 -> `executeJsCodeInSandbox`
- 方法是普通字符串 -> 走通用字符串解析器（`commonHomeListParse` 等）
- `lazy` 特殊处理：函数、字符串嗅探、`js:` 三种路径

### 5.5 缓存体系
- `moduleCache`：规则模块缓存
- `ruleObjectCache`：规则元信息缓存
- `jxCache`：解析器缓存
- `pageRequestCache`：页面请求短缓存（20秒）

`clearAllCache()` 会清模块缓存、规则缓存、解析缓存、页面缓存，并重置会话状态。

---

## 6. 字符串规则解析器（drpysParser）

核心文件：`libs/drpysParser.js`

### 6.1 为什么重要
大量源不是纯函数实现，而是用“字符串规则表达式”（`selector;title;pic;remark;link`）描述逻辑。该模块负责把这些字符串规则变成结构化输出。

### 6.2 核心机制
- `PageRequestCache(maxSize=20,maxAge=20s)` 防重复抓取
- `cachedRequest()` 用 `cachePrefix + md5(url+options)` 复用 HTML
- `commonHomeListParse/commonCategoryListParse/...` 统一解析推荐/一级/搜索/详情
- `executeSandboxFunction()` 在原沙箱上下文中安全执行 `request/getHtml/cachedRequest/...`

### 6.3 业务收益
- 规则作者可以写低代码表达式，降低维护门槛
- 同一解析流程支持 HTML 与 JSON 两种模式
- 通过缓存减少同请求链重复 IO

---

## 7. 多引擎适配层

### 7.1 hipy（Python）
核心文件：`libs/hipy.js`
- 对外暴露同构方法 `home/homeVod/category/...`
- 实际调用 `netCallPythonMethod` -> `spider/py/core/bridge.js`
- 缓存键：`filePath + ext + proxyUrl`

### 7.2 php（PHP）
核心文件：`libs/php.js`
- 通过 `_bridge.php` + `execFile(php)` 调 PHP Spider
- 维护 JS 方法名到 PHP 方法名映射（如 `home -> homeContent`）

### 7.3 catvod
核心文件：`libs/catvod.js`
- 动态 import 源文件
- 可注入 `initEnv(env)`
- 调用 `rule.init(default_init_cfg)` 完成模块初始化

### 7.4 xbpq
核心文件：`libs/xbpq.js`
- 保留了统一接口外壳
- 当前实现表现为最小骨架（后文有风险提示）

---

## 8. 动态配置中心（/config*）

核心文件：`controllers/config.js`

### 8.1 总体职责
把多目录异构源汇总成客户端可直接消费的配置：
- `sites`
- `parses`
- `lives`
- `player` 相关字段

### 8.2 generateSiteJSON
会扫描并并发处理：
- DS: `spider/js`
- DR2: `spider/js_dr2`
- PY: `spider/py`
- PHP: `spider/php`
- CAT: `spider/catvod`

关键行为：
- 支持订阅过滤（`sub`）
- 支持排序模板（`order_common*.html`）
- 支持源头注释缓存（`FileHeaderManager`）
- 支持 `SitesMap` 模板别名扩展
- 支持“青少年模式”过滤成人标签

### 8.3 /config* 请求处理
- 支持输出 `index.js/index.config.js` 与对应 md5
- 支持 `sub_code` 强制校验（`must_sub_code`）
- 支持 `healthy=1` 根据 `data/source-checker/report.json` 过滤失败源
- 最终合并：`{sites_count,...player,...sites,...parses,...lives}`
- 非 Vercel 环境会落盘 `index.json/custom.json`

业务价值：
- 配置在请求时动态生成，减少手工维护 JSON 的成本。
- 可在不改客户端的情况下动态切源、裁源、修复故障源。

---

## 9. 代理体系（媒体/文件/M3U8/全能）

### 9.1 proxy-util 公共能力
核心文件：`utils/proxy-util.js`
- `SmartCacheManager`：TTL + LRU + 定时清理 + 内存压力清理
- `verifyAuth`：代理接口统一鉴权（`PROXY_AUTH`）
- `decodeParam`：URL 与 headers 解码（含 base64 兼容）
- `makeRemoteRequest/getRemoteContent`：远程拉流
- `isInternalIp`：内网地址拦截

### 9.2 unified-proxy
核心文件：`controllers/unified-proxy.js`
- 自动判定 `m3u8` / `file`
- 优先路径失败后支持回退路径
- 暴露健康与状态接口

### 9.3 m3u8-proxy
核心文件：`controllers/m3u8-proxy.js`
- 代理 playlist 与 ts
- 改写 m3u8 内部相对链接为本地代理链接
- 对 m3u8 设置短缓存（30秒）

### 9.4 mediaProxy
核心文件：`controllers/mediaProxy.js`
- 处理 Range/分片/线程参数
- 支持长连接流式转发和资源回收

---

## 10. Python 守护进程链路（Node <-> Python）

### 10.1 Node 侧管理
核心文件：`utils/daemonManager.js`
- 启动脚本：`spider/py/core/t4_daemon.py` 或 `t4_daemon_lite.py`
- 端口：`127.0.0.1:57570`
- 能力：启动、等待端口可用、停止、PID 管理、日志落地

### 10.2 RPC 协议
Node 客户端：`spider/py/core/bridge.js`
- 请求：4字节长度 + JSON payload
- 响应：4字节长度 + pickle payload

Python 服务端：`spider/py/core/t4_daemon.py`
- `ThreadingTCPServer`
- `SpiderManager.call()` 统一入口
- 关键机制：
1. 实例缓存（按 `script_path + env(ext/proxy)` 哈希）
2. inflight 去重，避免并发重复初始化
3. init 信号量限制并发
4. LRU + 空闲过期清理

业务价值：
- Python 源不再每次冷启动解释器，显著降低延迟。
- 并发场景下避免“风暴式重复 init”。

---

## 11. 安全与鉴权模型

核心文件：`utils/api_validate.js`

- `validatePwd`：业务 API 密码（`API_PWD`）
- `validateBasicAuth`：管理类页面/配置 BasicAuth（`API_AUTH_NAME/API_AUTH_CODE`）
- `validateVercel`：Vercel 场景禁用不安全能力
- 代理鉴权：`PROXY_AUTH`（在 `proxy-util.js`）

说明：
- `/config/index*.js` 对 `validatePwd` 做了豁免，但保留 BasicAuth。
- `/health` 目前默认无鉴权（见后文风险）。

---

## 12. 关键缓存清单（落地运维重点）

1. 规则模块缓存：`libs/drpyS.js::moduleCache`
2. 规则元对象缓存：`libs/drpyS.js::ruleObjectCache`
3. 解析器缓存：`libs/drpyS.js::jxCache`
4. 页面短缓存：`libs/drpysParser.js::pageRequestCache`（20秒）
5. 代理缓存：`utils/proxy-util.js::SmartCacheManager`（默认 5 分钟）
6. M3U8 缓存：短 TTL（30秒）
7. ENV 缓存：`utils/env.js` LRU（5分钟）

运维建议：
- 高并发时重点观察代理缓存命中率、Python inflight 数与 init 失败率。
- 规则变更后若观察到脏数据，优先执行配置刷新路径或触发缓存清理。

---

## 13. 启动/构建/发布方式

核心文件：`package.json`

常用脚本：
- `npm run dev`：直接启动主服务
- `npm run pm2`：PM2 守护启动
- `npm run package*`：Python 或 Node 打包脚本
- `npm run bundle`：`drpy-node-bundle` 子项目打包

版本边界：
- `engines.node: >17 <23`

---

## 14. 业务视角的优先优化建议（非过度工程）

1. 先做“稳定性可观测”
- 为 `api.js` 每种接口加统一统计标签（耗时/成功率/超时率）
- 对 Python daemon 增加 `/stats` 暴露，便于压测定位瓶颈

2. 再做“性能收益最大”的点
- 对热点源做预热：启动后批量 `init` 高频站点，降低首请求延迟
- 对代理层启用分级缓存策略（按资源类型调 TTL）

3. 最后做“可维护性”
- 收敛多引擎共享接口的契约测试（home/category/detail/search/play）
- 把“规则执行错误”统一映射成机器可读错误码

---

## 15. 代码层风险与隐含问题（基于当前实现）

以下是阅读代码后得到的可落地风险点：

1. `controllers/api.js` 的 `RULE.callRuleFn` 在“未映射方法”分支中，把函数对象传进了 `withTimeout`，没有实际调用函数和参数。
- 影响：跨规则自定义方法可能行为不符合预期。
- 建议：改为 `withTimeout(Promise.resolve(RULE[_method](..._args)), ...)`。

2. `libs/xbpq.js` 当前 `init` 中 `let rule = {}; await rule.init(...)`，实现看起来是占位骨架，实际不可用概率很高。
- 影响：`do=xbpq` 可能在真实流量下直接失败。
- 建议：尽快补齐 xbpq 真实加载器，或在配置侧默认禁用。

3. `utils/daemonManager.js::isPythonAvailable()` 只看 `stdout.includes('Python')`。
- 影响：某些 Python 发行版把版本输出到 stderr，会误判“Python不可用”。
- 建议：同时检查 `stdout + stderr`。

4. 代理内网拦截主要基于字面 IP（`isInternalIp`），对域名解析后的内网回环场景防护不足。
- 影响：在恶意 DNS 场景下有 SSRF 风险窗口。
- 建议：请求前做 DNS 解析并校验结果网段。

5. 健康接口 `/health` 默认无鉴权，泄露运行形态（python 可用性、daemon 状态）。
- 影响：信息暴露风险。
- 建议：生产环境加最小鉴权或按环境开关。

---

## 16. 典型请求时序（便于排障）

### 16.1 `/api/某源?wd=关键词`
1. `api.js` 解析 query 并选引擎
2. 生成 env（含 proxy/json/public 等 URL）
3. `apiEngine.search` 调度
4. 引擎层加载/命中缓存
5. 规则执行（函数/字符串/js）
6. 结果标准化后返回

### 16.2 `/config/1?sub=all&healthy=1&pwd=...`
1. 校验密码/BasicAuth
2. 读取订阅规则与排序模板
3. 并发扫描多引擎源生成 sites
4. 读取健康报告过滤失效源
5. 合并 parses/lives/player
6. 返回并落盘 `index.json/custom.json`

### 16.3 `/proxy/源名/...`
1. 源规则返回代理元组
2. 如果是直返二进制就原样回传
3. 如果要求流代理则重定向 `/mediaProxy`
4. `mediaProxy` 处理 Range/headers 并流式输出

---

## 17. 最小落地运维清单

上线前：
1. 明确启用引擎（`enable_py/enable_php/enable_cat/enable_dr2`）
2. 配置鉴权（`API_PWD/API_AUTH_NAME/API_AUTH_CODE/PROXY_AUTH`）
3. 确认 Python daemon 可启动并监听 57570
4. 预热高频源，观察首包耗时

运行中：
1. 监控 API 超时率（`API_TIMEOUT/API_ACTION_TIMEOUT`）
2. 监控 daemon 日志与 inflight/init 失败
3. 监控代理缓存大小与淘汰频率
4. 定期清理失败源并更新健康报告

故障时：
1. 先判断是“规则错误”还是“代理错误”还是“守护进程错误”
2. 对单源执行 `refresh` 强制重建缓存
3. 必要时重启 daemon 与主服务，验证 `/health`

---

## 18. 总结

`drpy-node` 的设计重点不是单一爬虫能力，而是“多引擎统一编排 + 动态配置分发 + 代理播放闭环”。

如果你的目标是业务稳定与可运营，优先级应是：
1. 统一可观测性（超时、错误码、缓存命中）
2. 优先修复跨规则调用与 xbpq 可用性
3. 强化代理安全边界与健康接口鉴权

以上路线能在最小改动下，显著提升线上可控性与故障恢复速度。
