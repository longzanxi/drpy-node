# Docker 部署全流程（拉包 + 配置 + 启动 + 验证）

本文档对应文件：

- `Dockerfile`
- `docker-compose.yml`
- `docker.env.example`
- `docker/entrypoint.sh`

## 1. 前置条件

1. 已安装 Docker 与 Docker Compose 插件  
2. 能访问 `ghcr.io`（若镜像为私有包，需要 GitHub Token）  
3. 当前目录为 `drpy-node` 根目录

## 2. 准备配置文件

```bash
cd /path/to/drpy-node
cp docker.env.example .env.docker
mkdir -p config data logs
test -f config/env.json || echo '{}' > config/env.json
```

必须修改 `.env.docker` 的三项：

1. `API_AUTH_NAME`
2. `API_AUTH_CODE`
3. `API_PWD`

## 3. 登录并拉取镜像

若 GHCR 是私有镜像，先登录（Token 需要 `read:packages`）：

```bash
docker login ghcr.io -u <github_user>
```

拉取镜像并启动：

```bash
docker compose --env-file .env.docker pull
docker compose --env-file .env.docker up -d
```

## 4. 运行验证

查看容器状态：

```bash
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f --tail=200
```

健康检查：

```bash
curl http://127.0.0.1:5757/health
```

访问首页（需要 BasicAuth）：

```text
http://<API_AUTH_NAME>:<API_AUTH_CODE>@127.0.0.1:5757/
```

## 5. 订阅地址示例

猫配置示例（BasicAuth）：

```text
http://<API_AUTH_NAME>:<API_AUTH_CODE>@127.0.0.1:5757/config/index.js.md5
```

动态配置示例（pwd）：

```text
http://127.0.0.1:5757/config/1?sub=all&healthy=1&pwd=<API_PWD>
```

## 6. 升级流程

```bash
docker compose --env-file .env.docker pull
docker compose --env-file .env.docker up -d
docker image prune -f
```

## 7. 回退与停止

停止服务：

```bash
docker compose --env-file .env.docker down
```

回退到指定镜像标签（修改 `.env.docker` 中 `DRPY_IMAGE` 后重启）：

```bash
docker compose --env-file .env.docker up -d
```

## 8. 本地源码构建（可选）

如果你想不用远程镜像，直接本地构建：

```bash
docker build -t drpy-node:local .
```

然后把 `.env.docker` 里的 `DRPY_IMAGE` 改成：

```text
DRPY_IMAGE=drpy-node:local
```

再执行：

```bash
docker compose --env-file .env.docker up -d
```
