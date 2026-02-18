 "use client";
 
 import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
 
 export default function DashboardCTA() {
   const [href, setHref] = useState<string | null>(null);
 
   useEffect(() => {
    apiFetch("/me")
       .then((r) => (r.ok ? r.json() : Promise.reject()))
       .then((data) => {
         const role = (data.role as string) ?? "";
        if (role === "ADVERTISER") setHref("/app/advertiser");
        else if (role === "CHANNEL_ADMIN") setHref("/app/creator");
        else if (role === "OPS") setHref("/app/ops");
        else if (role === "BLOG_ADMIN") setHref("/app/blog");
         else setHref(null);
       })
       .catch(() => setHref(null));
   }, []);
 
   if (!href) return null;
   return (
    <a href={href} className="btn btn-primary" aria-label="Ir a mi dashboard">Ir a mi dashboard</a>
   );
 }
