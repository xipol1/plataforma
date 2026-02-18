 "use client";
 
 import { useState } from "react";
 import { useRouter } from "next/navigation";
 import { apiFetch } from "../lib/api";
 import { setToken } from "../lib/auth";
 
 export default function LoginPage() {
  const router = useRouter();
  const isDev = process.env.NODE_ENV !== "production";
  const [email, setEmail] = useState(isDev ? "advertiser@plataforma.local" : "");
  const [password, setPassword] = useState(isDev ? "advertiser123" : "");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleView, setRoleView] = useState<"ADVERTISER" | "CHANNEL_ADMIN" | "OPS">("ADVERTISER");
   const [mode, setMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
   const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function readErrorMessage(res: Response) {
    let text = "";
    try {
      text = await res.text();
    } catch {
      return `Error (${res.status})`;
    }
    try {
      const data = JSON.parse(text) as {
        message?: string;
        issues?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
      };
      const msg = (data?.message ?? "").trim();
      if (msg) return msg;
      const formErr = data?.issues?.formErrors?.find(Boolean);
      if (formErr) return formErr;
      const fieldErrs = data?.issues?.fieldErrors ?? {};
      for (const key of Object.keys(fieldErrs)) {
        const first = fieldErrs[key]?.find(Boolean);
        if (first) return `${key}: ${first}`;
      }
    } catch {}
    const cleaned = text.trim();
    return cleaned || `Error (${res.status})`;
  }
 
   async function onSubmit(e: React.FormEvent) {
     e.preventDefault();
    if (busy) return;
    if (mode === "REGISTER" && roleView === "OPS") {
      setStatus("No puedes crear una cuenta OPS desde aquí");
      return;
    }
    if (mode === "REGISTER" && password !== confirmPassword) {
      setStatus("Las contraseñas no coinciden");
      return;
    }
    setBusy(true);
    setStatus("Cargando...");
    const apiUrl = ""; // apiFetch will prefix base URL
     try {
      const url = mode === "LOGIN" ? "/auth/login" : "/auth/register";
      const payload = mode === "LOGIN" ? { email, password } : { email, password, role: roleView };
       const res = await apiFetch(`${apiUrl}${url}`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         auth: false,
         body: JSON.stringify(payload),
       });
       if (!res.ok) {
        const msg = await readErrorMessage(res);
        setStatus(msg || (mode === "LOGIN" ? "Error de login" : "Error de registro"));
        setBusy(false);
         return;
       }
       const data = await res.json();
      if (!data?.token) {
        setStatus("Respuesta inválida de la API");
        setBusy(false);
        return;
      }
      setToken(data.token);
      function getDashboardPath(r: string) {
        if (r === "ADVERTISER") return "/app/advertiser";
        if (r === "CHANNEL_ADMIN") return "/app/creator";
        if (r === "OPS") return "/app/ops";
        return "/app";
      }
      let role: string = data.user?.role ?? "";
      if (!role) {
        try {
          const me = await apiFetch(`/me`);
          if (me.ok) {
            const m = await me.json();
            role = m.role ?? "";
          }
        } catch {}
      }
      const target = getDashboardPath(role || roleView);
      const nextParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") ?? "" : "";
      const nextMatch = /^\/app\/(advertiser|creator|ops|blog)(\/.*)?$/.exec(nextParam);
      const isSpecificAppPath = !!nextMatch;
      const expectedSeg =
        role === "OPS"
          ? "ops"
          : role === "CHANNEL_ADMIN"
          ? "creator"
          : role === "ADVERTISER"
          ? "advertiser"
          : roleView === "CHANNEL_ADMIN"
          ? "creator"
          : roleView === "OPS"
          ? "ops"
          : "advertiser";
      let dest = isSpecificAppPath && nextMatch?.[1] === expectedSeg ? nextParam : target;
      if (role === "CHANNEL_ADMIN" && (dest === "/app/creator" || dest === "/app/creator/")) {
        try {
          const mine = await apiFetch(`/channels/mine`);
          if (mine.ok) {
            const rows = (await mine.json()) as unknown;
            if (Array.isArray(rows) && rows.length === 0) dest = "/app/creator/channels";
          }
        } catch {}
      }
      try {
        router.prefetch(dest);
      } catch {}
      router.replace(dest);
      setStatus("");
      setBusy(false);
     } catch {
       setStatus("API no disponible");
      setBusy(false);
     }
   }
 
   return (
    <main className="container">
      <section className="card reveal">
        <h1 className="title">Accede o crea tu cuenta</h1>
        <p className="subtitle">Para marcas: crear campaña y explorar canales. Para creadores: registrar canal y ver solicitudes.</p>
        <div className="row mb-sm">
          <button
            className={`btn ${mode === "LOGIN" ? "btn-primary btn-lg" : "btn-outline btn-lg"}`}
            onClick={() => {
              setMode("LOGIN");
              setStatus("");
              setConfirmPassword("");
            }}
          >
            Entrar
          </button>
          <button
            className={`btn ${mode === "REGISTER" ? "btn-primary btn-lg" : "btn-outline btn-lg"}`}
            onClick={() => {
              setMode("REGISTER");
              setStatus("");
              setConfirmPassword("");
            }}
          >
            Crear cuenta
          </button>
        </div>
        <div className="row mb-sm">
          <button
            className={`btn ${roleView === "ADVERTISER" ? "btn-primary btn-lg" : "btn-outline btn-lg"}`}
            onClick={() => {
              setRoleView("ADVERTISER");
              if (isDev) {
                setEmail("advertiser@plataforma.local");
                setPassword("advertiser123");
              } else {
                setEmail("");
                setPassword("");
              }
              setStatus("");
              setConfirmPassword("");
            }}
          >
            Soy anunciante
          </button>
          <button
            className={`btn ${roleView === "CHANNEL_ADMIN" ? "btn-primary btn-lg" : "btn-outline btn-lg"}`}
            onClick={() => {
              setRoleView("CHANNEL_ADMIN");
              if (isDev) {
                setEmail("admin@plataforma.local");
                setPassword("admin123");
              } else {
                setEmail("");
                setPassword("");
              }
              setStatus("");
              setConfirmPassword("");
            }}
          >
            Soy creador
          </button>
          <button
            className={`btn ${roleView === "OPS" ? "btn-primary btn-lg" : "btn-outline btn-lg"}`}
            onClick={() => {
              setRoleView("OPS");
              if (isDev) {
                setEmail("ops@plataforma.local");
                setPassword("ops12345");
              } else {
                setEmail("");
                setPassword("");
              }
              setStatus("");
              setConfirmPassword("");
            }}
          >
            Soy OPS
          </button>
          {status && <span className="badge" role="status" aria-live="polite">{status}</span>}
        </div>
        <div>
          {roleView === "ADVERTISER" ? (
            <div className="feature-card">
              <h3 className="feature-title">Acceso Anunciante</h3>
              <p className="feature-desc">Explora canales y crea campañas con pagos seguros. Accesos rápidos, métricas claras y flujo guiado.</p>
              <form onSubmit={onSubmit} className="form" aria-busy={busy}>
                <label className="label">
                  Email
                  <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" disabled={busy} />
                </label>
                <label className="label">
                  Password
                  <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" disabled={busy} />
                </label>
                {mode === "REGISTER" && (
                  <label className="label">
                    Repite password
                    <input className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" disabled={busy} />
                  </label>
                )}
                <div className="row">
                  <button type="submit" disabled={busy} className="btn btn-primary btn-lg btn-block">
                    {busy ? "Enviando..." : mode === "LOGIN" ? "Entrar" : "Registrarme"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="feature-card">
              <h3 className="feature-title">Acceso Creador</h3>
              <p className="feature-desc">Verifica tu canal, define precios y audiencias. Gestiona solicitudes y programa publicaciones con confianza.</p>
              <form onSubmit={onSubmit} className="form" aria-busy={busy}>
                <label className="label">
                  Email
                  <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" disabled={busy} />
                </label>
                <label className="label">
                  Password
                  <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" disabled={busy} />
                </label>
                {mode === "REGISTER" && (
                  <label className="label">
                    Repite password
                    <input className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" disabled={busy} />
                  </label>
                )}
                <div className="row">
                  <button type="submit" disabled={busy} className="btn btn-primary btn-lg btn-block">
                    {busy ? "Enviando..." : mode === "LOGIN" ? "Entrar" : "Registrarme"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
   );
 }
