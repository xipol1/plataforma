 "use client";
 
 import { useEffect, useState } from "react";
 
 type Campaign = {
   id: string;
   channelId: string;
   status: string;
   destinationUrl: string;
 };
 
 export default function InboxPage() {
   const [items, setItems] = useState<Campaign[]>([]);
   const [status, setStatus] = useState("");
   const [actionMsg, setActionMsg] = useState("");
 
   async function load() {
     const token = localStorage.getItem("token") ?? "";
     const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
     if (!token) {
       setStatus("Necesitas login");
       return;
     }
     try {
       const r = await fetch(`${apiUrl}/campaigns/inbox`, { headers: { Authorization: `Bearer ${token}` } });
       if (!r.ok) {
         setStatus("Error cargando campañas");
         return;
       }
       const data = await r.json();
       setItems(data);
       setStatus("");
     } catch {
       setStatus("API no disponible");
     }
   }
 
   useEffect(() => {
     void load();
   }, []);
 
   async function intent(campaignId: string) {
     setActionMsg("Creando intent...");
     const token = localStorage.getItem("token") ?? "";
     const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
     try {
       const res = await fetch(`${apiUrl}/payments/intent`, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({ campaignId }),
       });
       if (!res.ok) {
         setActionMsg("Error creando intent");
         return;
       }
       const data = await res.json();
       setActionMsg(`Intent OK: ${data.provider_ref} · ${data.amount} ${data.currency}`);
       void load();
     } catch {
       setActionMsg("API no disponible");
     }
   }
 
  return (
    <main className="container">
      <section className="card">
        <h1 className="title">Mis campañas</h1>
        <p className="subtitle">Gestiona pagos y estados de tus campañas. Contenido de ejemplo: estados posibles, consejos y atajos para acelerar gestión.</p>
        <div className="row" style={{ marginBottom: "0.5rem" }}>
          <button onClick={() => void load()} className="btn">
            Refrescar
          </button>
          {status && <span className="badge">{status}</span>}
          {actionMsg && <span className="badge">{actionMsg}</span>}
        </div>
        <ul className="list">
          {items.map((c) => (
            <li key={c.id} className="list-item">
              <div className="spaced">
                <div>
                  <strong>{c.id}</strong> · Canal {c.channelId}
                </div>
                <div className="badge">{c.status}</div>
              </div>
              <div className="row" style={{ marginTop: "0.5rem" }}>
                <a href={c.destinationUrl} target="_blank" className="btn">
                  Destino
                </a>
                <button onClick={() => intent(c.id)} className="btn btn-primary">
                  Crear pago
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
 }
