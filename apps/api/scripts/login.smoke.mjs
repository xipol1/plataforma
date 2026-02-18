import assert from "node:assert/strict";

const BASE = process.env.API_URL || "http://localhost:4000";

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {}
  assert.equal(res.status, 200, `login failed for ${email}: ${res.status} ${text}`);
  assert.ok(data.token, `missing token for ${email}`);
  return data.token;
}

async function me(token) {
  const res = await fetch(`${BASE}/me`, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {}
  assert.equal(res.status, 200, `me failed: ${res.status} ${text}`);
  return data;
}

async function checkUser({ email, password, expectedRole }) {
  const token = await login(email, password);
  const profile = await me(token);
  assert.equal(String(profile.role || ""), expectedRole, `role mismatch for ${email}`);
  return { email, role: profile.role };
}

async function main() {
  const results = [];
  results.push(await checkUser({ email: "advertiser@plataforma.local", password: "advertiser123", expectedRole: "ADVERTISER" }));
  results.push(await checkUser({ email: "admin@plataforma.local", password: "admin123", expectedRole: "CHANNEL_ADMIN" }));
  results.push(await checkUser({ email: "ops@plataforma.local", password: "ops12345", expectedRole: "OPS" }));
  results.push(await checkUser({ email: "blog@plataforma.local", password: "blog123", expectedRole: "BLOG_ADMIN" }));

  console.log(JSON.stringify({ base: BASE, ok: true, users: results }, null, 2));
}

main().catch((e) => {
  console.error("login smoke failed", e);
  process.exit(1);
});

