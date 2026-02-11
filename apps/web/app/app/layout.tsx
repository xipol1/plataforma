 "use client";
 
 import { useEffect, useState } from "react";
 import { usePathname, useRouter } from "next/navigation";
 
 export default function PrivateAppLayout({ children }: { children: React.ReactNode }) {
   const router = useRouter();
   const pathname = usePathname();
   const [role, setRole] = useState<"ADVERTISER" | "CHANNEL_ADMIN" | "OPS" | "GUEST">("GUEST");
 
   useEffect(() => {
     const token = typeof window !== "undefined" ? window.localStorage.getItem("token") ?? "" : "";
     if (!token) {
       setRole("GUEST");
       router.replace("/login");
       return;
     }
     const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
     fetch(`${apiUrl}/me`, { headers: { Authorization: `Bearer ${token}` } })
       .then((r) => (r.ok ? r.json() : Promise.reject()))
       .then((data) => {
         const r = (data.role as string) ?? "";
         if (r === "ADVERTISER" || r === "CHANNEL_ADMIN" || r === "OPS") {
           setRole(r as typeof role);
           const seg = pathname.split("/")[2] ?? "";
           if (r === "ADVERTISER" && seg !== "advertiser") router.replace("/app/advertiser");
           if (r === "CHANNEL_ADMIN" && seg !== "creator") router.replace("/app/creator");
           if (r === "OPS" && seg !== "ops") router.replace("/app/ops");
         } else {
           setRole("GUEST");
           router.replace("/login");
         }
       })
       .catch(() => {
         setRole("GUEST");
         router.replace("/login");
       });
   }, [pathname, router]);
 
  return (
    <div className="private-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <strong>AdFlow</strong>
        </div>
        <nav className="sidebar-nav" aria-label="Menú lateral">
          {role === "ADVERTISER" && (
            <>
              <a className={`nav-item ${pathname.startsWith("/app/advertiser") && (pathname === "/app/advertiser") ? "active" : ""}`} href="/app/advertiser"><span aria-hidden>🏠</span> <span>Resumen</span></a>
              <a className={`nav-item ${pathname.startsWith("/app/advertiser/inbox") ? "active" : ""}`} href="/app/advertiser/inbox"><span aria-hidden>📬</span> <span>Mis campañas</span></a>
              <a className={`nav-item ${pathname.startsWith("/app/advertiser/new") ? "active" : ""}`} href="/app/advertiser/new"><span aria-hidden>➕</span> <span>Nueva campaña</span></a>
              <a className="nav-item" href="/channels"><span aria-hidden>🔎</span> <span>Explorar canales</span></a>
            </>
          )}
          {role === "CHANNEL_ADMIN" && (
            <>
              <a className={`nav-item ${pathname.startsWith("/app/creator") && (pathname === "/app/creator") ? "active" : ""}`} href="/app/creator"><span aria-hidden>🏠</span> <span>Resumen</span></a>
              <a className={`nav-item ${pathname.startsWith("/app/creator/channels") ? "active" : ""}`} href="/app/creator/channels"><span aria-hidden>📺</span> <span>Mis canales</span></a>
              <a className={`nav-item ${pathname.startsWith("/app/creator/inbox") ? "active" : ""}`} href="/app/creator/inbox"><span aria-hidden>📥</span> <span>Solicitudes</span></a>
            </>
          )}
          {role === "OPS" && (
            <>
              <a className={`nav-item ${pathname.startsWith("/app/ops") ? "active" : ""}`} href="/app/ops"><span aria-hidden>🛠️</span> <span>Panel OPS</span></a>
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <a className="btn" href="/">Inicio</a>
          <button
            className="btn btn-primary"
            onClick={() => {
              window.localStorage.removeItem("token");
              router.replace("/login");
            }}
          >
            Salir
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
 }
