 "use client";
 
 import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import { clearToken, getToken } from "../lib/auth";
 
 export default function NavBar() {
   const [openMobile, setOpenMobile] = useState(false);
   const [openUser, setOpenUser] = useState(false);
   const [role, setRole] = useState<"GUEST" | "ADVERTISER" | "CHANNEL_ADMIN" | "OPS">("GUEST");
  const [theme, setTheme] = useState<"light" | "dark">("light");
   const userBtnRef = useRef<HTMLButtonElement | null>(null);
   useEffect(() => {
     const onKey = (e: KeyboardEvent) => {
       if (e.key === "Escape") {
         setOpenUser(false);
         setOpenMobile(false);
       }
     };
     window.addEventListener("keydown", onKey);
     return () => window.removeEventListener("keydown", onKey);
   }, []);
   useEffect(() => {
    const token = getToken();
     if (!token) {
       setRole("GUEST");
       return;
     }
    apiFetch("/me")
       .then((r) => r.ok ? r.json() : Promise.reject())
       .then((data) => {
         const r = (data.role as string) ?? "";
         if (r === "ADVERTISER") setRole("ADVERTISER");
         else if (r === "CHANNEL_ADMIN") setRole("CHANNEL_ADMIN");
         else if (r === "OPS") setRole("OPS");
         else setRole("GUEST");
       })
      .catch(() => {
        clearToken();
        setRole("GUEST");
      });
   }, []);
  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("theme") as "light" | "dark" | null : null;
    const prefersDark = typeof window !== "undefined" ? window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches : false;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", initial === "dark");
    }
  }, []);
  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try { window.localStorage.setItem("theme", next); } catch {}
    document.documentElement.classList.toggle("dark", next === "dark");
  }
 
  function logout() {
    clearToken();
    setRole("GUEST");
    setOpenUser(false);
    setOpenMobile(false);
    window.location.href = "/login";
  }

  const themeTitle = theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

   return (
     <header className="nav">
       <nav className="nav-inner" aria-label="Principal">
        <div className="spaced" style={{ width: "100%" }}>
          <div className="row" style={{ gap: "0.75rem", flex: 1 }}>
            <a href="/" className="brand">AdFlow</a>
          </div>
          <div className="row" style={{ gap: "0.5rem", justifyContent: "center", flex: 2 }}>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="/channels">Canales</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="row" style={{ gap: "0.5rem", justifyContent: "flex-end", flex: 1 }}>
            <button
              className="btn btn-icon theme-toggle"
              type="button"
              aria-label={themeTitle}
              title={themeTitle}
              aria-pressed={theme === "dark"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 2.75v2.1M12 19.15v2.1M4.75 12h-2.1M21.35 12h-2.1M5.35 5.35l1.5 1.5M17.15 17.15l1.5 1.5M18.65 5.35l-1.5 1.5M6.85 17.15l-1.5 1.5"
                    fill="none"
                  />
                  <path d="M12 7.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 0 0 0-9Z" fill="none" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M21 13.1A7.2 7.2 0 0 1 10.9 3a7.7 7.7 0 1 0 10.1 10.1Z"
                    fill="none"
                  />
                </svg>
              )}
            </button>
            {role === "GUEST" ? (
              <>
                <a className="btn" href="/login">Entrar</a>
                <a className="btn btn-primary cta-gradient" href="/login">Registrarse</a>
                <button
                  className="btn menu-btn mobile-menu-btn"
                  aria-label="Abrir menú móvil"
                  onClick={() => {
                    setOpenMobile((v) => !v);
                    setOpenUser(false);
                  }}
                >
                  ☰
                </button>
              </>
            ) : (
              <>
                <a
                  className="btn btn-primary"
                  href={
                    role === "ADVERTISER" ? "/app/advertiser"
                    : role === "CHANNEL_ADMIN" ? "/app/creator"
                    : role === "OPS" ? "/app/ops"
                    : "/app"
                  }
                >
                  Dashboard
                </a>
                <button
                  aria-haspopup="menu"
                  aria-expanded={openUser}
                  onClick={() => {
                    setOpenUser((v) => !v);
                    setOpenMobile(false);
                  }}
                  ref={userBtnRef}
                  className="btn user-menu-btn"
                >
                  Menú
                </button>
              </>
            )}
          </div>
        </div>
       </nav>
       {openUser && (
         <div className="modal-backdrop" onClick={() => setOpenUser(false)}>
           <div
             className="modal-card"
             role="dialog"
             aria-modal="true"
             aria-labelledby="user-menu-title"
             onClick={(e) => e.stopPropagation()}
             tabIndex={-1}
             onKeyDown={(e) => { if (e.key === "Escape") setOpenUser(false); }}
           >
             <div className="modal-header">
               <h3 id="user-menu-title" className="modal-title">Menú rápido</h3>
               <button className="modal-close" onClick={() => setOpenUser(false)}>Cerrar</button>
             </div>
             <div className="grid" style={{ gap: "0.5rem" }}>
               {role === "ADVERTISER" && (
                 <>
                   <a className="btn" href="/campaigns/new">Crear campaña</a>
                   <a className="btn" href="/campaigns/inbox">Ver mis campañas</a>
                   <a className="btn" href="/channels">Explorar canales</a>
                  <a className="btn btn-primary" href="/gadgets/resumen">Gadget de resumen</a>
                 </>
               )}
               {role === "CHANNEL_ADMIN" && (
                 <>
                   <a className="btn" href="/app/creator">Ir a mi dashboard</a>
                 </>
               )}
               {role === "OPS" && (
                 <>
                   <a className="btn" href="/app/ops">Panel OPS</a>
                 </>
               )}
               {role === "GUEST" && (
                 <>
                   <a className="btn btn-primary" href="/login?next=/app/advertiser">Entrar</a>
                   <a className="btn" href="/about">Ver cómo funciona</a>
                 </>
               )}
               {role !== "GUEST" && (
                 <button className="btn btn-primary" onClick={logout}>
                   Cerrar sesión
                 </button>
               )}
             </div>
           </div>
         </div>
       )}
       {openMobile && (
         <div className="modal-backdrop" onClick={() => setOpenMobile(false)}>
           <div
             className="modal-card"
             role="dialog"
             aria-modal="true"
             aria-labelledby="mobile-menu-title"
             onClick={(e) => e.stopPropagation()}
             tabIndex={-1}
           >
             <div className="modal-header">
               <h3 id="mobile-menu-title" className="modal-title">Navegación</h3>
               <button className="modal-close" onClick={() => setOpenMobile(false)}>Cerrar</button>
             </div>
            <div className="grid" style={{ gap: "0.5rem" }}>
              {role === "GUEST" ? (
                <>
                  <a className="btn" href="#como-funciona">Cómo funciona</a>
                  <a className="btn" href="/channels">Canales</a>
                  <a className="btn" href="#faq">FAQ</a>
                  <a className="btn btn-primary" href="/login">Entrar</a>
                </>
              ) : (
                <>
                  {role !== "CHANNEL_ADMIN" && (<a className="btn" href="/channels">Canales</a>)}
                  {role === "ADVERTISER" && (<a className="btn" href="/campaigns/new">Crear campaña</a>)}
                  {role === "ADVERTISER" && (<a className="btn" href="/campaigns/inbox">Mis campañas</a>)}
                  {role === "CHANNEL_ADMIN" && (<a className="btn" href="/app/creator">Ir a mi dashboard</a>)}
                  {role === "OPS" && (<a className="btn" href="/ops">OPS</a>)}
                  <button
                    className="btn btn-primary"
                    onClick={logout}
                  >
                    Salir
                  </button>
                </>
              )}
            </div>
           </div>
         </div>
       )}
     </header>
   );
 }
