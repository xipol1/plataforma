 "use client";
 
 import { useEffect } from "react";
 import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import { clearToken, getToken } from "../lib/auth";
 
 export default function AppRootRedirect() {
   const router = useRouter();
   useEffect(() => {
    const token = getToken();
     if (!token) {
       router.replace("/login?next=/app");
       return;
     }
    apiFetch("/me")
       .then((r) => (r.ok ? r.json() : Promise.reject()))
       .then((me) => {
         const role = (me.role as string) ?? "";
         if (role === "ADVERTISER") router.replace("/app/advertiser");
         else if (role === "CHANNEL_ADMIN") router.replace("/app/creator");
         else if (role === "OPS") router.replace("/app/ops");
         else if (role === "BLOG_ADMIN") router.replace("/app/blog");
         else router.replace("/app/advertiser");
       })
       .catch(() => {
        clearToken();
         router.replace("/login?next=/app");
       });
   }, [router]);
 
   return (
     <main className="container">
       <section className="card">
         <h1 className="title">Redirigiendo…</h1>
         <p className="subtitle">Comprobando tu sesión y rol.</p>
       </section>
     </main>
   );
 }
