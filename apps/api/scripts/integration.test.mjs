// minimal integration tests for dev (pg-mem, no Stripe)
import assert from "node:assert";

const BASE = process.env.API_URL ?? "http://localhost:4000";

async function register(email, password, role) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.ok(data.token);
  assert.ok(data.user?.id);
  assert.equal(String(data.user?.email ?? ""), String(email).toLowerCase());
  assert.equal(String(data.user?.role ?? ""), role);
  return data.token;
}

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

async function me(token) {
  const res = await fetch(`${BASE}/me`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 200);
  return res.json();
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

async function testTracking(opsToken) {
  const res = await fetch(`${BASE}/r/44444444-4444-4444-4444-444444444444`, {
    redirect: "manual",
    headers: { "User-Agent": "Mozilla/5.0  Test   UA" },
  });
  assert.equal(res.status, 302);
  const sum = await fetch(`${BASE}/campaigns/44444444-4444-4444-4444-444444444444/summary`, {
    headers: { Authorization: `Bearer ${opsToken}` },
  });
  assert.equal(sum.status, 200);
  const data = await sum.json();
  assert.ok(typeof data.total === "number");
  return data;
}

async function setCampaignStatus(id, nextStatus, opsToken) {
  const res = await fetch(`${BASE}/campaigns/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${opsToken}` },
    body: JSON.stringify({ status: nextStatus }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, nextStatus);
}

async function requestPublish(id, advToken) {
  const res = await fetch(`${BASE}/campaigns/${id}/request-publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${advToken}` },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.requested);
}

async function listOpsRequests(opsToken) {
  const res = await fetch(`${BASE}/campaigns/ops/requests?limit=20&offset=0`, {
    headers: { Authorization: `Bearer ${opsToken}` },
  });
  const total = res.headers.get("x-total-count");
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, total, data, text };
}

async function publishCampaign(id, opsToken) {
  const now = Date.now();
  const startAt = new Date(now + 45 * 60 * 1000).toISOString();
  const endAt = new Date(now + 2 * 60 * 60 * 1000).toISOString();
  const res = await fetch(`${BASE}/campaigns/${id}/publish`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${opsToken}` },
    body: JSON.stringify({ startAt, endAt }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, "PUBLISHED");
  return data;
}

async function main() {
  const now = Date.now();
  const itEmailAdv = `ITEST_ADV_${now}@plataforma.local`;
  const itPassAdv = "itestpass123";
  const regTokenAdv = await register(itEmailAdv, itPassAdv, "ADVERTISER");
  const meAdv = await me(regTokenAdv);
  assert.equal(String(meAdv.role ?? ""), "ADVERTISER");

  const dup = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: itEmailAdv.toLowerCase(), password: itPassAdv, role: "ADVERTISER" }),
  });
  assert.equal(dup.status, 409);

  const loginTokenAdv = await login(itEmailAdv.toLowerCase(), itPassAdv);
  const meAdv2 = await me(loginTokenAdv);
  assert.equal(String(meAdv2.role ?? ""), "ADVERTISER");

  const itEmailCreator = `ITEST_CREATOR_${now}@plataforma.local`;
  const itPassCreator = "itestpass123";
  const regTokenCreator = await register(itEmailCreator, itPassCreator, "CHANNEL_ADMIN");
  const meCreator = await me(regTokenCreator);
  assert.equal(String(meCreator.role ?? ""), "CHANNEL_ADMIN");

  const advToken = await login("advertiser@plataforma.local", "advertiser123");
  const opsToken = await login("ops@plataforma.local", "ops12345");
  const intent = await testIntentMock(advToken);
  const summary = await testTracking(opsToken);
  const requests = await listOpsRequests(opsToken);
  if (requests.status !== 200) {
    console.log("ops/requests error:", requests.text);
  }
  assert.equal(requests.status, 200);
  assert.ok(requests.total !== null);
  assert.ok(Number(requests.total) >= 0);
  console.log(
    JSON.stringify(
      {
        intent,
        summary,
        opsRequestsStatus: requests.status,
        opsRequestsTotal: requests.total,
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
