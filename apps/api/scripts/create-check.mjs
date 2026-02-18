const api = "http://localhost:4000";

async function post(path, body, token) {
  const r = await fetch(api + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body ?? {}),
  });
  const text = await r.text();
  return { status: r.status, text };
}

const login = await post("/auth/login", { email: "advertiser@plataforma.local", password: "advertiser123" });
console.log("login", login.status, login.text.slice(0, 120));
const token = JSON.parse(login.text).token;
const create1 = await post("/campaigns", { channelId: "11111111-1111-1111-1111-111111111111", copyText: "x", destinationUrl: "https://example.com" }, token);
console.log("create1", create1.status, create1.text);
const create2 = await post(
  "/campaigns",
  { channelId: "11111111-1111-1111-1111-111111111111", copyText: "x", destinationUrl: "https://example.com", scheduledAt: new Date().toISOString() },
  token,
);
console.log("create2", create2.status, create2.text);

