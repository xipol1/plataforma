 "use client";
 
 import { useState } from "react";
 import { useRouter } from "next/navigation";
 
 export default function LoginPage() {
   const router = useRouter();
   const [email, setEmail] = useState("advertiser@plataforma.local");
   const [password, setPassword] = useState("advertiser123");
   const [roleView, setRoleView] = useState<"ADVERTISER" | "CHANNEL_ADMIN">("ADVERTISER");
   const [mode, setMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
   const [status, setStatus] = useState<string>("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [channelName, setChannelName] = useState("");
  const [category, setCategory] = useState("");
 
   async function onSubmit(e: React.FormEvent) {
     e.preventDefault();
     setStatus("Cargando...");
     const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
     try {
      const url = mode === "LOGIN" ? "/auth/login" : "/auth/register";
      const payload =
        mode === "LOGIN"
          ? { email, password }
          : roleView === "ADVERTISER"
          ? { email, password, role: roleView, name, company }
          : { email, password, role: roleView, channelName, category };
       const res = await fetch(`${apiUrl}${url}`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload),
       });
       if (!res.ok) {
         setStatus(mode === "LOGIN" ? "Error de login" : "Error de registro");
         return;
       }
       const data = await res.json();
       localStorage.setItem("token", data.token);
      const qp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      const nextUrl = qp.get("next") ?? "";
      function isInternal(u: string) {
        return u.startsWith("/") && !u.startsWith("//");
      }
      function getDashboardPath(r: string) {
        if (r === "ADVERTISER") return "/app/advertiser";
        if (r === "CHANNEL_ADMIN") return "/app/creator";
        if (r === "OPS") return "/app/ops";
        return "/app";
      }
      let role: string = data.user?.role ?? "";
      if (!role) {
        try {
          const me = await fetch(`${apiUrl}/me`, { headers: { Authorization: `Bearer ${data.token}` } });
          if (me.ok) {
            const m = await me.json();
            role = m.role ?? "";
          }
        } catch {}
      }
      const target = isInternal(nextUrl) ? nextUrl : getDashboardPath(role);
      router.replace(target);
       setStatus("");
     } catch {
       setStatus("API no disponible");
     }
   }
 
   return (
    <main className="container">
      <section className="card reveal">
        <h1 className="title">Elige tu acceso</h1>
        <p className="subtitle">Divide el acceso entre quienes se publicitan y quienes crean canales. Descubre contenido de ejemplo y guías en cada sección.</p>
        <div className="row" style={{ marginBottom: "0.75rem" }}>
          <button
            className={`btn ${mode === "LOGIN" ? "btn-primary btn-lg" : "btn-outline btn-lg"}`}
            onClick={() => { setMode("LOGIN"); setStatus(""); }}
          >
            Login
          </button>
          <button
            className={`btn ${mode === "REGISTER" ? "btn-primary btn-lg" : "btn-outline btn-lg"}`}
            onClick={() => { setMode("REGISTER"); setStatus(""); }}
          >
            Register
          </button>
        </div>
        <div className="row" style={{ marginBottom: "0.75rem" }}>
          <button
            className={`btn ${roleView === "ADVERTISER" ? "btn-primary btn-lg" : "btn-outline btn-lg"}`}
            onClick={() => {
              setRoleView("ADVERTISER");
              setEmail("advertiser@plataforma.local");
              setPassword("advertiser123");
              setStatus("");
            }}
          >
            Soy anunciante
          </button>
          <button
            className={`btn ${roleView === "CHANNEL_ADMIN" ? "btn-primary btn-lg" : "btn-outline btn-lg"}`}
            onClick={() => {
              setRoleView("CHANNEL_ADMIN");
              setEmail("admin@plataforma.local");
              setPassword("admin123");
              setStatus("");
            }}
          >
            Soy creador
          </button>
          {status && <span className="badge">{status}</span>}
        </div>
        <div>
          {roleView === "ADVERTISER" ? (
            <div className="feature-card">
              <h3 className="feature-title">Acceso Anunciante</h3>
              <p className="feature-desc">Explora canales y crea campañas con pagos seguros. Contenido de ejemplo: campañas recomendadas, presupuestos orientativos y CTA rápidos.</p>
              <form onSubmit={onSubmit} className="form">
                <label className="label">
                  Email
                  <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                </label>
                <label className="label">
                  Password
                  <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
                </label>
                {mode === "REGISTER" && (
                  <>
                    <label className="label">
                      Nombre
                      <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                    </label>
                    <label className="label">
                      Empresa
                      <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
                    </label>
                  </>
                )}
                <div className="row">
                  <button type="submit" className="btn btn-primary btn-lg btn-block">{mode === "LOGIN" ? "Entrar" : "Registrarme"}</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="feature-card">
              <h3 className="feature-title">Acceso Creador</h3>
              <p className="feature-desc">Publica y verifica tu canal, define precios y audiencias. Contenido de ejemplo: buenas prácticas de pricing, categorías sugeridas y checklist de verificación.</p>
              <form onSubmit={onSubmit} className="form">
                <label className="label">
                  Email
                  <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                </label>
                <label className="label">
                  Password
                  <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
                </label>
                {mode === "REGISTER" && (
                  <>
                    <label className="label">
                      Nombre del canal
                      <input className="input" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
                    </label>
                    <label className="label">
                      Categoría
                      <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
                    </label>
                  </>
                )}
                <div className="row">
                  <button type="submit" className="btn btn-primary btn-lg btn-block">{mode === "LOGIN" ? "Entrar" : "Registrarme"}</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
   );
 }
