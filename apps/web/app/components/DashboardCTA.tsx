 "use client";
 
 import { useEffect, useState } from "react";
 
 export default function DashboardCTA() {
   const [href, setHref] = useState<string | null>(null);
 
   useEffect(() => {
     const token = typeof window !== "undefined" ? window.localStorage.getItem("token") ?? "" : "";
     if (!token) {
       setHref(null);
       return;
     }
     const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
     fetch(`${apiUrl}/me`, { headers: { Authorization: `Bearer ${token}` } })
       .then((r) => (r.ok ? r.json() : Promise.reject()))
       .then((data) => {
         const role = (data.role as string) ?? "";
         if (role === "ADVERTISER") setHref("/app/advertiser");
         else if (role === "CHANNEL_ADMIN") setHref("/app/creator");
         else if (role === "OPS") setHref("/app/ops");
         else setHref(null);
       })
       .catch(() => setHref(null));
   }, []);
 
   if (!href) return null;
   return (
     <a href={href} className="btn btn-primary">Ir a mi dashboard</a>
   );
 }
