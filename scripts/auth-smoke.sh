#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:4000}"
EMAIL="${AUTH_TEST_EMAIL:-auth-smoke@example.com}"
PASSWORD="${AUTH_TEST_PASSWORD:-Secret123!}"

register_payload=$(cat <<JSON
{"email":"${EMAIL}","password":"${PASSWORD}","role":"ADVERTISER"}
JSON
)

register_response=$(curl -sS -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "${register_payload}")

login_response=$(curl -sS -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

token=$(node -e 'const fs=require("fs");const body=fs.readFileSync(0,"utf8");const obj=JSON.parse(body);if(!obj.token){process.exit(1)};process.stdout.write(obj.token);' <<<"${login_response}")

me_response=$(curl -sS "${API_URL}/me" -H "Authorization: Bearer ${token}")

echo "Register: ${register_response}"
echo "Login: ${login_response}"
echo "Me: ${me_response}"
