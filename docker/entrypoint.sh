#!/usr/bin/env sh
set -eu

cd /app

if [ ! -f .env ] && [ -f .env.development ]; then
  cp .env.development .env
fi

mkdir -p logs data/source-checker data/ctf-local-adapter config || true

if [ ! -f config/env.json ]; then
  printf '{}\n' > config/env.json || true
fi

exec "$@"
