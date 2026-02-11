 "use client";
 
 import { useEffect, useRef, useState } from "react";
 
 export default function NavBar() {
   const [openMobile, setOpenMobile] = useState(false);
   const [openUser, setOpenUser] = useState(false);
   const [role, setRole] = useState<"GUEST" | "ADVERTISER" | "CHANNEL_ADMIN" | "OPS">("GUEST");
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
     const token = typeof window !== "undefined" ? window.localStorage.getItem("token") ?? "" : "";
     if (!token) {
       setRole("GUEST");
       return;
     }
     const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
     fetch(`${apiUrl}/me`, { headers: { Authorization: `Bearer ${token}` } })
       .then((r) => r.ok ? r.json() : Promise.reject())
       .then((data) => {
         const r = (data.role as string) ?? "";
         if (r === "ADVERTISER") setRole("ADVERTISER");
         else if (r === "CHANNEL_ADMIN") setRole("CHANNEL_ADMIN");
         else if (r === "OPS") setRole("OPS");
         else setRole("GUEST");
       })
       .catch(() => setRole("GUEST"));
   }, []);
 
   return (
     <header className="nav">
       <nav className="nav-inner" aria-label="Principal">
         <div className="spaced" style={{ width: "100%" }}>
           <div className="row" style={{ gap: "0.75rem" }}>
             <strong>AdFlow</strong>
             <a href="/">Inicio</a>
             {role !== "GUEST" && role !== "CHANNEL_ADMIN" && (<a href="/channels">Canales</a>)}
             {role === "ADVERTISER" && (<a href="/app/advertiser/new">Nueva campaña</a>)}
             {role === "ADVERTISER" && (<a href="/app/advertiser/inbox">Mis campañas</a>)}
             {role === "OPS" && (<a href="/app/ops">OPS</a>)}
             <a href="/about">About</a>
           </div>
           <div className="row" style={{ gap: "0.5rem" }}>
             <button
               className="btn"
               aria-haspopup="menu"
               aria-expanded={openUser}
               onClick={() => {
                 setOpenUser((v) => !v);
                 setOpenMobile(false);
               }}
               ref={userBtnRef}
             >
               Menú
             </button>
             {role === "GUEST" ? (
               <a className="btn btn-primary" href="/login">Login/Register</a>
             ) : (
               <button
                 className="btn btn-primary"
                 onClick={() => {
                   window.localStorage.removeItem("token");
                   setRole("GUEST");
                   window.location.href = "/";
                 }}
               >
                 Salir
               </button>
             )}
             <button
               className="btn"
               aria-label="Abrir menú móvil"
               onClick={() => {
                 setOpenMobile((v) => !v);
                 setOpenUser(false);
               }}
             >
               ☰
             </button>
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
                 </>
               )}
               {role === "CHANNEL_ADMIN" && (
                 <>
                   <a className="btn" href="/app/creator">Ir a mi dashboard</a>
                 </>
               )}
               {role === "OPS" && (
                 <>
                   <a className="btn" href="/ops">Panel OPS</a>
                 </>
               )}
               {role === "GUEST" && (
                 <>
                   <a className="btn btn-primary" href="/login">Login/Register</a>
                   <a className="btn" href="/about">About</a>
                 </>
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
               <a className="btn" href="/">Inicio</a>
               {role !== "GUEST" && role !== "CHANNEL_ADMIN" && (<a className="btn" href="/channels">Canales</a>)}
               {role === "ADVERTISER" && (<a className="btn" href="/campaigns/new">Nueva campaña</a>)}
               {role === "ADVERTISER" && (<a className="btn" href="/campaigns/inbox">Mis campañas</a>)}
               {role === "CHANNEL_ADMIN" && (<a className="btn" href="/app/creator">Ir a mi dashboard</a>)}
               {role === "OPS" && (<a className="btn" href="/ops">OPS</a>)}
               <a className="btn" href="/about">About</a>
               {role === "GUEST" ? (
                 <a className="btn btn-primary" href="/login">Login/Register</a>
               ) : (
                 <button
                   className="btn btn-primary"
                   onClick={() => {
                     window.localStorage.removeItem("token");
                     setRole("GUEST");
                     window.location.href = "/";
                   }}
                 >
                   Salir
                 </button>
               )}
             </div>
           </div>
         </div>
       )}
     </header>
   );
 }
