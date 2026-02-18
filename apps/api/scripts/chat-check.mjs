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
  const opsLogin = await post("/auth/login", { email: "ops@plataforma.local", password: "ops12345" });

  if (!advLogin.ok || !creLogin.ok || !opsLogin.ok) {
    console.log(JSON.stringify({ advLogin, creLogin, opsLogin }, null, 2));
    process.exit(1);
  }
  const advToken = advLogin.body.token;
  const creToken = creLogin.body.token;
  const opsToken = opsLogin.body.token;

  const channelId = "11111111-1111-1111-1111-111111111111";
  const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const created = await post(
    "/campaigns",
    { channelId, copyText: "Campaña test chat", destinationUrl: "https://example.com", scheduledAt },
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

  const request = await post(`/campaigns/${campaignId}/request-publish`, {}, advToken);

  const send1 = await post(`/chat/${campaignId}/messages`, { body: "Hola! Podemos ajustar horario y copy. Mi mail es test@x.com" }, advToken);

  const creatorViewBefore = await get(`/chat/${campaignId}/messages`, creToken);

  const pending = await get(`/ops/chat/moderation?status=PENDING_REVIEW&limit=50&offset=0`, opsToken);
  const pendingMsg = Array.isArray(pending.body) ? pending.body.find((m) => m.campaignId === campaignId) : null;
  const approve = pendingMsg ? await post(`/ops/chat/moderation/${pendingMsg.id}/approve`, {}, opsToken) : null;

  const creatorViewAfter = await get(`/chat/${campaignId}/messages`, creToken);

  console.log(
    JSON.stringify(
      {
        campaignId,
        intent,
        request,
        send1,
        creatorViewBefore: { ok: creatorViewBefore.ok, status: creatorViewBefore.status, items: creatorViewBefore.body?.items?.length ?? null },
        moderationCount: Array.isArray(pending.body) ? pending.body.length : null,
        approved: approve,
        creatorViewAfter: { ok: creatorViewAfter.ok, status: creatorViewAfter.status, items: creatorViewAfter.body?.items?.length ?? null },
      },
      null,
      2,
    ),
  );

  const beforeCount = creatorViewBefore.body?.items?.length ?? 0;
  const afterCount = creatorViewAfter.body?.items?.length ?? 0;
  if (beforeCount !== 0) process.exitCode = 2;
  if (afterCount < 1) process.exitCode = 3;
}

await main();

