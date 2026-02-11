// minimal integration tests for dev (pg-mem, no Stripe)
import assert from "node:assert";

const BASE = process.env.API_URL ?? "http://localhost:4000";

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.token);
  return data.token;
}

async function testIntentMock(token) {
  const res = await fetch(`${BASE}/payments/intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      campaignId: "44444444-4444-4444-4444-444444444444",
      currency: "USD",
      idempotencyKey: "itest-key-1",
    }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.provider_ref);
  assert.equal(data.currency, "USD");
  return data;
}

async function testTracking() {
  const res = await fetch(`${BASE}/r/44444444-4444-4444-4444-444444444444`, {
    redirect: "manual",
    headers: { "User-Agent": "Mozilla/5.0  Test   UA" },
  });
  assert.equal(res.status, 302);
  const sum = await fetch(`${BASE}/campaigns/44444444-4444-4444-4444-444444444444/summary`, {
    headers: { Authorization: `Bearer ${await login("ops@plataforma.local", "ops12345")}` },
  });
  assert.equal(sum.status, 200);
  const data = await sum.json();
  assert.ok(typeof data.total === "number");
  return data;
}

async function main() {
  const advToken = await login("advertiser@plataforma.local", "advertiser123");
  const intent = await testIntentMock(advToken);
  const summary = await testTracking();
  console.log(
    JSON.stringify(
      {
        intent,
        summary,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error("integration tests failed", e);
  process.exit(1);
});
