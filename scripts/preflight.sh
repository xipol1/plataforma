#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:4000}"

npm run doctor
curl -sS -i "${API_URL}/health" >/tmp/preflight-health.out

echo "[preflight] /health"
cat /tmp/preflight-health.out

echo "[preflight] creating temporary CHANNEL_ADMIN + PENDING channel"
EMAIL="preflight-admin-$(date +%s)@example.com"
PASSWORD="Secret123!"

curl -sS -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  --data "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\",\"role\":\"CHANNEL_ADMIN\"}" >/tmp/preflight-register.json

CA_TOKEN=$(curl -sS -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  --data "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" | node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(o.token||"")')

CHANNEL_JSON=$(curl -sS -X POST "${API_URL}/channels" \
  -H "Authorization: Bearer ${CA_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"platform":"TELEGRAM","name":"Preflight Pending","category":"security","audienceSize":1234,"engagementHint":"manual check","pricePerPost":66}')

CHANNEL_ID=$(node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(o.id||"")' <<<"${CHANNEL_JSON}")

if [ -z "${CHANNEL_ID}" ]; then
  echo "[preflight] failed creating channel"
  echo "${CHANNEL_JSON}"
  exit 1
fi

STATUS_CODE=$(curl -sS -o /tmp/preflight-private.out -w "%{http_code}" "${API_URL}/channels/${CHANNEL_ID}")
echo "[preflight] GET /channels/:id without auth => ${STATUS_CODE}"
cat /tmp/preflight-private.out
if [ "${STATUS_CODE}" != "404" ]; then
  echo "Expected 404 for non-active hidden channel"
  exit 1
fi

echo "[preflight] weird filters (must not 500)"
for URL in \
  "${API_URL}/channels?limit=5000" \
  "${API_URL}/channels?min_price=abc" \
  "${API_URL}/channels?max_price=-1" \
  "${API_URL}/channels?offset=-2"; do
  CODE=$(curl -sS -o /tmp/preflight-filter.out -w "%{http_code}" "$URL")
  echo "URL=$URL => HTTP ${CODE}"
  if [ "$CODE" = "500" ]; then
    echo "Unexpected 500 for filter URL: $URL"
    cat /tmp/preflight-filter.out
    exit 1
  fi
done

echo "[preflight] completed"
