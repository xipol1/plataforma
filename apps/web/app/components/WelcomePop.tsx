 "use client";
 
 import { useEffect, useRef, useState } from "react";
 
 export default function WelcomePop() {
   const [open, setOpen] = useState(false);
   const closeBtnRef = useRef<HTMLButtonElement | null>(null);
   useEffect(() => {
     const seen = typeof window !== "undefined" ? window.localStorage.getItem("welcome_seen") : "1";
     if (!seen) {
       setOpen(true);
     }
   }, []);
   useEffect(() => {
     if (open) {
       document.body.style.overflow = "hidden";
       closeBtnRef.current?.focus();
     } else {
       document.body.style.overflow = "";
     }
   }, [open]);
 
   if (!open) return null;
   return (
     <div className="modal-backdrop" onClick={() => { setOpen(false); window.localStorage.setItem("welcome_seen", "1"); }}>
       <div
         className="modal-card"
         role="dialog"
         aria-modal="true"
         aria-labelledby="welcome-title"
         onClick={(e) => e.stopPropagation()}
         onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); window.localStorage.setItem("welcome_seen", "1"); } }}
         tabIndex={-1}
       >
         <div className="modal-header">
           <h3 id="welcome-title" className="modal-title">Bienvenida</h3>
           <button ref={closeBtnRef} className="modal-close" onClick={() => { setOpen(false); window.localStorage.setItem("welcome_seen", "1"); }}>Cerrar</button>
         </div>
         <div className="grid" style={{ gap: "0.75rem" }}>
           <p className="feature-desc">Para continuar, inicia sesión o regístrate. Tras acceso verás las herramientas según tu perfil.</p>
           <div className="row" style={{ gap: "0.5rem" }}>
            <a className="btn btn-primary" href="/login?next=/app/advertiser">Login/Register</a>
           </div>
         </div>
       </div>
     </div>
   );
 }
