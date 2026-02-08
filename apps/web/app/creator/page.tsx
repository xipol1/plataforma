 "use client";
 
 import { useState } from "react";
 
 export default function CreatorPage() {
   const [status, setStatus] = useState("");
   const [created, setCreated] = useState<Array<any>>([]);
 
   const [platform] = useState<"TELEGRAM">("TELEGRAM");
   const [name, setName] = useState("Mi Canal Pro");
   const [category, setCategory] = useState("tecnología");
   const [audienceSize, setAudienceSize] = useState(5000);
   const [engagementHint, setEngagementHint] = useState("buen CTR en herramientas y tutoriales");
   const [pricePerPost, setPricePerPost] = useState(80);
 
   const [verifyPlatform] = useState<"TELEGRAM">("TELEGRAM");
   const [channelRef, setChannelRef] = useState("");
   const [userRef, setUserRef] = useState("");
   const [verifyMsg, setVerifyMsg] = useState("");
 
   const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
 
   async function createChannel(e: React.FormEvent) {
     e.preventDefault();
     setStatus("Creando canal...");
     const token = localStorage.getItem("token") ?? "";
     if (!token) {
       setStatus("Necesitas login como creador");
       return;
     }
     try {
       const res = await fetch(`${apiUrl}/channels`, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({ platform, name, category, audienceSize, engagementHint, pricePerPost }),
       });
       const data = await res.json();
       if (!res.ok) {
         setStatus(data.message ?? "Error creando canal");
         return;
       }
       setCreated((prev) => [data, ...prev]);
       setStatus(`Canal creado: ${data.name} · estado ${data.status}`);
     } catch {
       setStatus("API no disponible");
     }
   }
 
   async function verifyOwnership(e: React.FormEvent) {
     e.preventDefault();
     setVerifyMsg("Verificando propiedad...");
     const token = localStorage.getItem("token") ?? "";
     if (!token) {
       setVerifyMsg("Necesitas login como creador");
       return;
     }
     try {
       const res = await fetch(`${apiUrl}/channels/verify`, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({ platform: verifyPlatform, channelRef, userRef }),
       });
       const data = await res.json();
       setVerifyMsg(res.ok ? `Verificado: ${String(data.verified)} con ${data.provider}` : data.message ?? "Error verificando");
     } catch {
       setVerifyMsg("API no disponible");
     }
   }
 
  return (
    <main className="container">
      <section className="card reveal">
         <h1 className="title">Panel del Creador</h1>
        <p className="subtitle">Publica tu canal, define precios y verifica propiedad. Contenido de ejemplo: guía rápida para optimizar tu ficha y mejorar conversión.</p>
 
         <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
           <div>
             <h2 className="title">Publicar canal</h2>
             <form onSubmit={createChannel} className="form">
               <label className="label">
                 Plataforma
                 <select className="select" value={platform} disabled>
                   <option value="TELEGRAM">Telegram</option>
                 </select>
               </label>
               <label className="label">
                 Nombre
                 <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
               </label>
               <label className="label">
                 Categoría
                 <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
               </label>
               <label className="label">
                 Audiencia
                 <input className="input" type="number" value={audienceSize} onChange={(e) => setAudienceSize(Number(e.target.value))} />
               </label>
               <label className="label">
                 Engagement
                 <input className="input" value={engagementHint} onChange={(e) => setEngagementHint(e.target.value)} />
               </label>
               <label className="label">
                 Precio por publicación (USD)
                 <input className="input" type="number" value={pricePerPost} onChange={(e) => setPricePerPost(Number(e.target.value))} />
               </label>
               <div className="row">
                 <button type="submit" className="btn btn-primary">Crear canal</button>
                 {status && <span className="badge">{status}</span>}
               </div>
             </form>
           </div>
 
           <div>
             <h2 className="title">Verificar propiedad</h2>
             <form onSubmit={verifyOwnership} className="form">
               <label className="label">
                 Plataforma
                 <select className="select" value={verifyPlatform} disabled>
                   <option value="TELEGRAM">Telegram</option>
                 </select>
               </label>
               <label className="label">
                 Referencia del canal (chat_id)
                 <input className="input" value={channelRef} onChange={(e) => setChannelRef(e.target.value)} placeholder="@mi_canal_o_id" />
               </label>
               <label className="label">
                 Tu usuario (user_id)
                 <input className="input" value={userRef} onChange={(e) => setUserRef(e.target.value)} placeholder="123456789" />
               </label>
               <div className="row">
                 <button type="submit" className="btn">Verificar</button>
                 {verifyMsg && <span className="badge">{verifyMsg}</span>}
               </div>
             </form>
           </div>
         </div>
 
         <div style={{ marginTop: "1rem" }}>
           <h2 className="title">Tus canales</h2>
           <ul className="list">
             {created.length === 0 ? (
               <li className="list-item">No tienes canales creados aún. Crea uno arriba y verás aquí ejemplos de cómo se mostrarán tus datos.</li>
             ) : (
               created.map((c) => (
                 <li key={c.id} className="list-item">
                   <div className="spaced">
                     <div>
                       <strong>{c.name}</strong> · {c.category} · {c.platform} · {c.audienceSize} suscr.
                     </div>
                     <div className="badge">{c.status}</div>
                   </div>
                 </li>
               ))
             )}
           </ul>
         </div>
 
         <div className="footer">Consejo: configura tu precio competitivo y añade un buen “engagement hint”.</div>
       </section>
     </main>
   );
 }
