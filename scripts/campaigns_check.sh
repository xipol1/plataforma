#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:4000}"

# ensure OPS account with known password for check
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
  ["ops.check@example.com", hash],
);
await client.end();
JS

ADV_EMAIL="adv-check-$(date +%s)@example.com"
CH_EMAIL="ch-check-$(date +%s)@example.com"
PASS="Secret123!"

curl -sS -X POST "${API_URL}/auth/register" -H "Content-Type: application/json" \
  --data "{\"email\":\"${ADV_EMAIL}\",\"password\":\"${PASS}\",\"role\":\"ADVERTISER\"}" >/tmp/adv-reg.json
curl -sS -X POST "${API_URL}/auth/register" -H "Content-Type: application/json" \
  --data "{\"email\":\"${CH_EMAIL}\",\"password\":\"${PASS}\",\"role\":\"CHANNEL_ADMIN\"}" >/tmp/ch-reg.json

ADV_TOKEN=$(curl -sS -X POST "${API_URL}/auth/login" -H "Content-Type: application/json" \
  --data "{\"email\":\"${ADV_EMAIL}\",\"password\":\"${PASS}\"}" | node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(o.token||"")')
CH_TOKEN=$(curl -sS -X POST "${API_URL}/auth/login" -H "Content-Type: application/json" \
  --data "{\"email\":\"${CH_EMAIL}\",\"password\":\"${PASS}\"}" | node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(o.token||"")')
OPS_TOKEN=$(curl -sS -X POST "${API_URL}/auth/login" -H "Content-Type: application/json" \
  --data '{"email":"ops.check@example.com","password":"Secret123!"}' | node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(o.token||"")')

# channel admin creates channel (PENDING), OPS activates
CH_CREATE=$(curl -sS -X POST "${API_URL}/channels" -H "Authorization: Bearer ${CH_TOKEN}" -H "Content-Type: application/json" \
  --data '{"platform":"TELEGRAM","name":"Campaign Check Channel","category":"checks","audienceSize":9000,"engagementHint":"good","pricePerPost":99}')
CHANNEL_ID=$(node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(o.id||"")' <<<"${CH_CREATE}")

curl -sS -X PATCH "${API_URL}/channels/${CHANNEL_ID}" -H "Authorization: Bearer ${OPS_TOKEN}" -H "Content-Type: application/json" \
  --data '{"status":"ACTIVE"}' >/tmp/ch-activate.json

# advertiser creates campaign (DRAFT)
C_CREATE=$(curl -sS -X POST "${API_URL}/campaigns" -H "Authorization: Bearer ${ADV_TOKEN}" -H "Content-Type: application/json" \
  --data "{\"channelId\":\"${CHANNEL_ID}\",\"copyText\":\"Manual-first campaign\",\"destinationUrl\":\"https://example.com\"}")
CAMPAIGN_ID=$(node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(o.id||"")' <<<"${C_CREATE}")

check_status() {
  local expected="$1"
  local body
  body=$(curl -sS -H "Authorization: Bearer ${ADV_TOKEN}" "${API_URL}/campaigns/${CAMPAIGN_ID}")
  local status
  status=$(node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(o.status||"")' <<<"${body}")
  echo "status=${status}, expected=${expected}"
  if [ "${status}" != "${expected}" ]; then
    echo "Unexpected status transition"
    echo "${body}"
    exit 1
  fi
}

check_status "DRAFT"

curl -sS -X POST "${API_URL}/campaigns/${CAMPAIGN_ID}/submit" -H "Authorization: Bearer ${ADV_TOKEN}" >/tmp/c-submit.json
check_status "READY_FOR_PAYMENT"

curl -sS -X POST "${API_URL}/ops/campaigns/${CAMPAIGN_ID}/mark-paid" -H "Authorization: Bearer ${OPS_TOKEN}" >/tmp/c-paid.json
check_status "PAID"

curl -sS -X POST "${API_URL}/campaigns/${CAMPAIGN_ID}/confirm-published" -H "Authorization: Bearer ${CH_TOKEN}" >/tmp/c-pub.json
check_status "PUBLISHED"

curl -sS -X POST "${API_URL}/ops/campaigns/${CAMPAIGN_ID}/complete" -H "Authorization: Bearer ${OPS_TOKEN}" >/tmp/c-complete.json
check_status "COMPLETED"

echo "campaigns_check: OK"
