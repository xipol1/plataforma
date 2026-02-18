 "use client";
 
 import { useEffect } from "react";
 import { useRouter } from "next/navigation";
 
 export default function BlogDashboardRedirect() {
   const router = useRouter();
   useEffect(() => {
     router.replace("/app/blog");
   }, [router]);
   return (
     <main className="container">
       <section className="card">
         <h1 className="title">Redirigiendo…</h1>
         <p className="subtitle">Accediendo a tu dashboard de blogs.</p>
       </section>
     </main>
   );
 }
