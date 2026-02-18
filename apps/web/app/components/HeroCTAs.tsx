 "use client";
 
  import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
 
 export default function HeroCTAs() {
   const [href, setHref] = useState<string | null>(null);
 
   useEffect(() => {
    apiFetch(`/me`)
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
 
   return (
     <div className="hero-ctas">
       <a href="/channels" className="btn btn-primary">Explorar canales</a>
       {href ? (
         <a href={href} className="btn">Ir a mi dashboard</a>
       ) : (
         <a href="/campaigns/new" className="btn">Crear campaña</a>
       )}
     </div>
   );
 }
