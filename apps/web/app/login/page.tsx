 "use client";
 
 import { useState } from "react";
 
 export default function LoginPage() {
  const [email, setEmail] = useState("advertiser@plataforma.local");
  const [password, setPassword] = useState("advertiser123");
  const [roleView, setRoleView] = useState<"ADVERTISER" | "CHANNEL_ADMIN">("ADVERTISER");
   const [status, setStatus] = useState<string>("");
 
   async function onSubmit(e: React.FormEvent) {
     e.preventDefault();
     setStatus("Cargando...");
     const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
     try {
       const res = await fetch(`${apiUrl}/auth/login`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ email, password }),
       });
       if (!res.ok) {
         setStatus("Error de login");
         return;
       }
       const data = await res.json();
       localStorage.setItem("token", data.token);
       setStatus(`Login OK: ${data.user.email} (${data.user.role})`);
     } catch {
       setStatus("API no disponible");
     }
   }
 
  return (
    <main className="container">
      <section className="card">
        <h1 className="title">Elige tu acceso</h1>
        <p className="subtitle">Divide el acceso entre quienes se publicitan y quienes crean canales. Descubre contenido de ejemplo y guías en cada sección.</p>
        <div className="row" style={{ marginBottom: "0.75rem" }}>
          <button
            className={`btn ${roleView === "ADVERTISER" ? "btn-primary" : ""}`}
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
            className={`btn ${roleView === "CHANNEL_ADMIN" ? "btn-primary" : ""}`}
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
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
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
              <div className="row">
                <button type="submit" className="btn btn-primary">Entrar</button>
                <a href="/channels" className="btn">Ver canales</a>
                <a href="/campaigns/new" className="btn">Crear campaña</a>
              </div>
            </form>
          </div>
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
              <div className="row">
                <button type="submit" className="btn btn-primary">Entrar</button>
                <a href="/creator" className="btn">Panel Creador</a>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
 }
