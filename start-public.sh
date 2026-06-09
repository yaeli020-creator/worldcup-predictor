#!/bin/bash
# 启动本地服务 + 外网隧道（Cloudflare Quick Tunnel）
cd "$(dirname "$0")"

PORT=8123

if ! lsof -i :$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "启动本地服务 http://127.0.0.1:$PORT ..."
  python3 -m http.server $PORT &
  sleep 1
fi

CF="$PWD/.bin/cloudflared"
if [ ! -x "$CF" ]; then
  echo "正在下载 cloudflared..."
  mkdir -p .bin
  curl -fsSL -o .bin/cloudflared.tgz "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz"
  tar -xzf .bin/cloudflared.tgz -C .bin && chmod +x .bin/cloudflared
fi

echo "正在创建外网访问地址（关闭本窗口后外网链接会失效）..."
echo "日志写入 .tunnel.log，地址会在几秒内出现"
"$CF" tunnel --url "http://127.0.0.1:$PORT" 2>&1 | tee .tunnel.log
