export function getApiUrl() {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window === "undefined") return env ?? "http://localhost:4000";
  const proto = window.location.protocol || "http:";
  const host = window.location.hostname || "localhost";
  const fallback = `${proto}//${host}:4000`;
  if (!env) return fallback;
  const isLocalEnv = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(env.trim());
  const isLocalHost = host === "localhost" || host === "127.0.0.1";
  if (isLocalEnv && !isLocalHost) return fallback;
  return env;
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit & { auth?: boolean; redirectToLogin?: boolean }) {
  const auth = init?.auth !== false;
  const apiUrl = getApiUrl();
  const url = typeof input === "string" ? (input.startsWith("http") ? input : `${apiUrl}${input}`) : input;
  const headers = new Headers(init?.headers || {});
  if (auth) {
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("token") ?? "" : "";
      if (token) headers.set("Authorization", `Bearer ${token}`);
    } catch {}
  }
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401 && (init?.redirectToLogin ?? true)) {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("token");
        const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/login";
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
      }
    } catch {}
  }
  return res;
}
