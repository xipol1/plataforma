#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:4000}"

# ensure OPS account with known password
node <<'JS'
import dotenv from "dotenv";
import argon2 from "argon2";
import { Client } from "pg";

dotenv.config({ path: ".env" });
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const hash = await argon2.hash("Secret123!");
await client.query(
  `INSERT INTO "User"(email, "passwordHash", role)
   VALUES ($1, $2, 'OPS'::"UserRole")
   ON CONFLICT (email)
   DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", role = EXCLUDED.role`,
  ["ops.tracking@example.com", hash],
);
await client.end();
JS

ADV_EMAIL="adv-track-$(date +%s)@example.com"
CH_EMAIL="ch-track-$(date +%s)@example.com"
PASS="Secret123!"

curl -sS -X POST "${API_URL}/auth/register" -H "Content-Type: application/json" \
  --data "{\"email\":\"${ADV_EMAIL}\",\"password\":\"${PASS}\",\"role\":\"ADVERTISER\"}" >/tmp/adv-track-reg.json
curl -sS -X POST "${API_URL}/auth/register" -H "Content-Type: application/json" \
  --data "{\"email\":\"${CH_EMAIL}\",\"password\":\"${PASS}\",\"role\":\"CHANNEL_ADMIN\"}" >/tmp/ch-track-reg.json

ADV_TOKEN=$(curl -sS -X POST "${API_URL}/auth/login" -H "Content-Type: application/json" \
  --data "{\"email\":\"${ADV_EMAIL}\",\"password\":\"${PASS}\"}" | node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(o.token||"")')
CH_TOKEN=$(curl -sS -X POST "${API_URL}/auth/login" -H "Content-Type: application/json" \
  --data "{\"email\":\"${CH_EMAIL}\",\"password\":\"${PASS}\"}" | node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(o.token||"")')
OPS_TOKEN=$(curl -sS -X POST "${API_URL}/auth/login" -H "Content-Type: application/json" \
  --data '{"email":"ops.tracking@example.com","password":"Secret123!"}' | node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(o.token||"")')

# create and activate channel
CHANNEL_ID=$(curl -sS -X POST "${API_URL}/channels" -H "Authorization: Bearer ${CH_TOKEN}" -H "Content-Type: application/json" \
  --data '{"platform":"TELEGRAM","name":"Tracking Channel","category":"tracking","audienceSize":4200,"engagementHint":"good","pricePerPost":70}' | node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(o.id||"")')

curl -sS -X PATCH "${API_URL}/channels/${CHANNEL_ID}" -H "Authorization: Bearer ${OPS_TOKEN}" -H "Content-Type: application/json" \
  --data '{"status":"ACTIVE"}' >/tmp/ch-track-activate.json

# create campaign and move to PUBLISHED
CAMPAIGN_ID=$(curl -sS -X POST "${API_URL}/campaigns" -H "Authorization: Bearer ${ADV_TOKEN}" -H "Content-Type: application/json" \
  --data "{\"channelId\":\"${CHANNEL_ID}\",\"copyText\":\"tracking flow\",\"destinationUrl\":\"https://example.com/landing\"}" | node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(o.id||"")')

curl -sS -X POST "${API_URL}/campaigns/${CAMPAIGN_ID}/submit" -H "Authorization: Bearer ${ADV_TOKEN}" >/tmp/track-submit.json
curl -sS -X POST "${API_URL}/ops/campaigns/${CAMPAIGN_ID}/mark-paid" -H "Authorization: Bearer ${OPS_TOKEN}" >/tmp/track-paid.json
curl -sS -X POST "${API_URL}/campaigns/${CAMPAIGN_ID}/confirm-published" -H "Authorization: Bearer ${CH_TOKEN}" >/tmp/track-published.json

# redirect should count click and issue 302
REDIRECT_CODE=$(curl -sS -o /tmp/track-redirect.out -w "%{http_code}" -H 'User-Agent: tracking-check' -H 'Referer: https://origin.example' "${API_URL}/r/${CAMPAIGN_ID}")
SECOND_CODE=$(curl -sS -o /tmp/track-redirect-2.out -w "%{http_code}" -H 'User-Agent: tracking-check' -H 'Referer: https://origin.example' "${API_URL}/r/${CAMPAIGN_ID}")
echo "redirect_status=${REDIRECT_CODE}, second=${SECOND_CODE}"
if [ "${REDIRECT_CODE}" != "302" ] || [ "${SECOND_CODE}" != "302" ]; then
  echo "Expected 302 redirect"
  exit 1
fi

STATS=$(curl -sS -H "Authorization: Bearer ${ADV_TOKEN}" "${API_URL}/campaigns/${CAMPAIGN_ID}/stats")
TOTAL=$(node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(o.valid_clicks_total ?? ""))' <<<"${STATS}")
LAST24=$(node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(o.valid_clicks_last_24h ?? ""))' <<<"${STATS}")

echo "stats=${STATS}"
if [ "${TOTAL}" -lt 1 ] || [ "${LAST24}" -lt 1 ]; then
  echo "Expected valid click metrics >= 1"
  exit 1
fi

echo "tracking_check: OK"
