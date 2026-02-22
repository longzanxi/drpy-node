# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    tini \
    python3 \
    python3-venv \
    python3-pip \
    php-cli \
    php-curl \
    php-mbstring \
    php-xml \
    php-sqlite3 \
    php-mysql \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS deps

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

COPY spider/py/base/requirements.txt /tmp/requirements.txt
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip setuptools wheel \
    && /opt/venv/bin/pip install --no-cache-dir -r /tmp/requirements.txt

FROM base AS runtime

ENV NODE_ENV=production \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/opt/venv \
    PYTHON_PATH=/opt/venv/bin/python
ENV PATH="/opt/venv/bin:${PATH}"

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /opt/venv /opt/venv
COPY . .

RUN if [ -f .env.development ] && [ ! -f .env ]; then cp .env.development .env; fi \
    && mkdir -p logs data/source-checker data/ctf-local-adapter \
    && if [ ! -f config/env.json ]; then echo '{}' > config/env.json; fi \
    && chown -R node:node /app /opt/venv

USER node

EXPOSE 5757 57575

HEALTHCHECK --interval=30s --timeout=8s --start-period=20s --retries=3 \
    CMD curl -fsS http://127.0.0.1:5757/health || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "index.js"]
