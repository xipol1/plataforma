#!/usr/bin/env bash
set -euo pipefail

PORT_WEB="${PORT_WEB:-3000}"
TUNNEL_PROVIDER="${TUNNEL_PROVIDER:-local}"

cleanup() {
  if [[ -n "${WEB_PID:-}" ]] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting web preview on http://localhost:${PORT_WEB} ..."
npm run dev -w apps/web > /tmp/plataforma-web-preview.log 2>&1 &
WEB_PID=$!

for i in {1..60}; do
  if curl -fsS "http://127.0.0.1:${PORT_WEB}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "http://127.0.0.1:${PORT_WEB}" >/dev/null 2>&1; then
  echo "❌ Web did not start correctly."
  echo "Log: /tmp/plataforma-web-preview.log"
  exit 1
fi

echo "✅ Local preview ready: http://localhost:${PORT_WEB}"

echo "Provider: ${TUNNEL_PROVIDER}"
case "$TUNNEL_PROVIDER" in
  local)
    echo "No public tunnel requested."
    echo "Keep this process running while you test locally."
    ;;
  localtunnel)
    echo "Attempting public preview with localtunnel..."
    echo "(Press Ctrl+C to stop)"
    npx --yes localtunnel --port "$PORT_WEB"
    ;;
  *)
    echo "Unknown TUNNEL_PROVIDER='${TUNNEL_PROVIDER}'. Use: local | localtunnel"
    exit 1
    ;;
esac

wait "$WEB_PID"
