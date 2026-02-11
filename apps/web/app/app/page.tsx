 "use client";
 
 import { useEffect } from "react";
 import { useRouter } from "next/navigation";
 
 export default function AppRootRedirect() {
   const router = useRouter();
   useEffect(() => {
     const token = typeof window !== "undefined" ? window.localStorage.getItem("token") ?? "" : "";
     if (!token) {
       router.replace("/login?next=/app");
       return;
     }
     const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
     fetch(`${apiUrl}/me`, { headers: { Authorization: `Bearer ${token}` } })
       .then((r) => (r.ok ? r.json() : Promise.reject()))
       .then((me) => {
         const role = (me.role as string) ?? "";
         if (role === "ADVERTISER") router.replace("/app/advertiser");
         else if (role === "CHANNEL_ADMIN") router.replace("/app/creator");
         else if (role === "OPS") router.replace("/app/ops");
         else router.replace("/app/advertiser");
       })
       .catch(() => {
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
