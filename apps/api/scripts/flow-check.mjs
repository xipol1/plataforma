const api = process.env.API_URL ?? "http://localhost:4000";

const headersJson = { "Content-Type": "application/json" };

async function post(path, body, token) {
  const r = await fetch(api + path, {
    method: "POST",
    headers: { ...headersJson, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body ?? {}),
  });
  const t = await r.text();
  let j;
  try {
    j = JSON.parse(t);
  } catch {
    j = t;
  }
  return { ok: r.ok, status: r.status, body: j };
}

async function get(path, token) {
  const r = await fetch(api + path, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const t = await r.text();
  let j;
  try {
    j = JSON.parse(t);
  } catch {
    j = t;
  }
  return { ok: r.ok, status: r.status, body: j };
}

async function main() {
  const advLogin = await post("/auth/login", { email: "advertiser@plataforma.local", password: "advertiser123" });
  const creLogin = await post("/auth/login", { email: "admin@plataforma.local", password: "admin123" });
  if (!advLogin.ok || !creLogin.ok) {
    console.log(JSON.stringify({ advLogin, creLogin }, null, 2));
    process.exit(1);
  }

  const advToken = advLogin.body.token;
  const creToken = creLogin.body.token;

  const channelId = "11111111-1111-1111-1111-111111111111";
  const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const created = await post(
    "/campaigns",
    { channelId, copyText: "Campaña test flujo SUBMITTED", destinationUrl: "https://example.com", scheduledAt },
    advToken,
  );
  if (!created.ok) {
    console.log(JSON.stringify({ created }, null, 2));
    process.exit(1);
  }
  const campaignId = created.body.id;

  const idem =
    globalThis.crypto?.randomUUID?.() ??
    `idem_${Math.random().toString(16).slice(2)}_${Date.now()}`;

  const intent = await post("/payments/intent", { campaignId, idempotencyKey: idem }, advToken);
  const c1 = await get(`/campaigns/${campaignId}`, advToken);

  const inbox = await get("/creator/inbox", creToken);
  const inInbox = Array.isArray(inbox.body) ? inbox.body.find((x) => x.id === campaignId) : null;

  const published = await post(`/creator/inbox/${campaignId}/confirm-published`, {}, creToken);
  const c2 = await get(`/campaigns/${campaignId}`, advToken);

  const stats0 = await get(`/campaigns/${campaignId}/tracking-stats`, advToken);

  await fetch(api + `/r/${campaignId}`, { redirect: "manual" }).catch(() => {});
  await fetch(api + `/t/view/${campaignId}.gif`, { redirect: "manual" }).catch(() => {});

  const stats1 = await get(`/campaigns/${campaignId}/tracking-stats`, advToken);

  console.log(
    JSON.stringify(
      {
        created: { id: campaignId, scheduledAt },
        intent,
        statusAfterPay: c1.body?.status ?? null,
        inInbox: inInbox ? { status: inInbox.status } : null,
        published,
        statusAfterPublish: c2.body?.status ?? null,
        stats0,
        stats1,
      },
      null,
      2,
    ),
  );

  if (c1.body?.status !== "SUBMITTED") process.exitCode = 2;
  if (c2.body?.status !== "PUBLISHED") process.exitCode = 3;
}

await main();

