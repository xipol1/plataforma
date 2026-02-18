"use client";
 
import { useEffect, useState } from "react";
 import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import { clearToken, getToken } from "../lib/auth";
 
type Role = "ADVERTISER" | "CHANNEL_ADMIN" | "OPS" | "BLOG_ADMIN" | "GUEST";

type MenuLink = {
  href: string;
  title: string;
  desc: string;
  tone?: "primary" | "default";
  badge?: number | string;
};

function MenuSection({
  title,
  links,
  pathname,
  onNavigate,
}: {
  title: string;
  links: MenuLink[];
  pathname: string;
  onNavigate: () => void;
}) {
  const sectionCount = links.reduce((sum, l) => (typeof l.badge === "number" ? sum + l.badge : sum), 0);
  return (
    <div className="qm-section">
      <div className="qm-section-title">
        <span>{title}</span>
        {sectionCount > 0 ? <span className="qm-pill">{sectionCount}</span> : null}
      </div>
      <div className="qm-items">
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
          const showBadge = typeof l.badge === "number" ? l.badge > 0 : typeof l.badge === "string" ? Boolean(l.badge) : false;
          return (
            <a
              key={l.href}
              className={`qm-item ${l.tone === "primary" ? "qm-item-primary" : ""} ${active ? "active" : ""}`}
              href={l.href}
              onClick={onNavigate}
            >
              <div className="qm-item-main">
                <div className="qm-item-title">{l.title}</div>
                <div className="qm-item-desc">{l.desc}</div>
              </div>
              {showBadge ? <span className="qm-pill qm-pill-item">{l.badge}</span> : null}
              <span className="qm-item-arrow" aria-hidden="true">›</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

 export default function PrivateAppLayout({ children }: { children: React.ReactNode }) {
   const router = useRouter();
   const pathname = usePathname();
  const [role, setRole] = useState<Role>("GUEST");
  const [userEmail, setUserEmail] = useState("");
  const [menuStats, setMenuStats] = useState<{
    creatorPending: number;
    creatorUpcoming: number;
    creatorPayouts: number;
    advertiserPending: number;
    advertiserPendingPayment: number;
    advertiserReview: number;
  }>({
    creatorPending: 0,
    creatorUpcoming: 0,
    creatorPayouts: 0,
    advertiserPending: 0,
    advertiserPendingPayment: 0,
    advertiserReview: 0,
  });
  const [supportOpen, setSupportOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportMsg, setSupportMsg] = useState("");
 
   useEffect(() => {
    const token = getToken();
     if (!token) {
      setRole("GUEST");
      router.replace("/login?next=/app/advertiser");
       return;
     }
    apiFetch("/me")
       .then((r) => (r.ok ? r.json() : Promise.reject()))
       .then((data) => {
        setUserEmail((data.email as string) ?? "");
         const r = (data.role as string) ?? "";
          if (r === "ADVERTISER" || r === "CHANNEL_ADMIN" || r === "OPS" || r === "BLOG_ADMIN") {
           setRole(r as typeof role);
           const seg = pathname.split("/")[2] ?? "";
          if (r === "ADVERTISER" && seg !== "advertiser") router.replace("/app/advertiser");
          if (r === "CHANNEL_ADMIN" && seg !== "creator") router.replace("/app/creator");
          if (r === "OPS" && seg !== "ops") router.replace("/app/ops");
          if (r === "BLOG_ADMIN" && seg !== "blog") router.replace("/app/blog");
         } else {
          setRole("GUEST");
          setUserEmail("");
          clearToken();
          const next = pathname.startsWith("/app/") ? pathname : "/app/advertiser";
          router.replace(`/login?next=${encodeURIComponent(next)}`);
         }
       })
       .catch(() => {
        setRole("GUEST");
        setUserEmail("");
        clearToken();
        const next = pathname.startsWith("/app/") ? pathname : "/app/advertiser";
        router.replace(`/login?next=${encodeURIComponent(next)}`);
       });
   }, [pathname, router]);
 
  useEffect(() => {
    setQuickOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!quickOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQuickOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [quickOpen]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    if (role !== "ADVERTISER" && role !== "CHANNEL_ADMIN") return;

    let cancelled = false;

    async function loadStats() {
      try {
        if (role === "CHANNEL_ADMIN") {
          const [inboxRes, pubRes, billRes] = await Promise.all([
            apiFetch("/creator/inbox"),
            apiFetch("/creator/publications"),
            apiFetch("/creator/billing/summary?window_days=30&limit=1"),
          ]);

          const inbox = inboxRes.ok ? ((await inboxRes.json()) as Array<{ status: string }>) : [];
          const publications = pubRes.ok ? ((await pubRes.json()) as Array<unknown>) : [];
          const billing = billRes.ok ? ((await billRes.json()) as { pending_payouts?: number }) : null;

          const blocked = new Set(["COMPLETED", "REFUNDED", "DISPUTED"]);
          const pending = inbox.filter((r) => !blocked.has(r.status)).length;
          const upcoming = publications.length;
          const payouts = Math.max(0, Number(billing?.pending_payouts ?? 0));

          if (!cancelled) {
            setMenuStats({
              creatorPending: pending,
              creatorUpcoming: upcoming,
              creatorPayouts: payouts,
              advertiserPending: 0,
              advertiserPendingPayment: 0,
              advertiserReview: 0,
            });
          }
        }

        if (role === "ADVERTISER") {
          const res = await apiFetch("/campaigns/inbox?limit=200&offset=0");
          const rows = res.ok ? ((await res.json()) as Array<{ status: string }>) : [];
          const pendingPaymentSet = new Set(["DRAFT", "READY_FOR_PAYMENT"]);
          const reviewSet = new Set(["SUBMITTED", "PAID", "READY"]);
          const doneSet = new Set(["PUBLISHED", "COMPLETED", "REFUNDED"]);

          const pendingPayment = rows.filter((r) => pendingPaymentSet.has(r.status)).length;
          const review = rows.filter((r) => reviewSet.has(r.status)).length;
          const pending = rows.filter((r) => !doneSet.has(r.status)).length;

          if (!cancelled) {
            setMenuStats({
              creatorPending: 0,
              creatorUpcoming: 0,
              creatorPayouts: 0,
              advertiserPending: pending,
              advertiserPendingPayment: pendingPayment,
              advertiserReview: review,
            });
          }
        }
      } catch {}
    }

    void loadStats();
    const timer = window.setInterval(() => void loadStats(), 20000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [role]);

  const advertiserCampaignDesc =
    menuStats.advertiserPending > 0
      ? `${menuStats.advertiserPendingPayment} pago · ${menuStats.advertiserReview} revisión`
      : "Gestiona y revisa estado";

  const advertiserLinks: MenuLink[] = [
    { href: "/app/advertiser", title: "Resumen", desc: "KPIs, operación y actividad" },
    { href: "/app/advertiser/inbox", title: "Campañas", desc: advertiserCampaignDesc, badge: menuStats.advertiserPending },
    { href: "/app/advertiser/new", title: "Crear campaña", desc: "Nueva publicación pagada", tone: "primary" },
    { href: "/channels", title: "Explorar canales", desc: "Descubre audiencias y precios" },
    { href: "/gadgets/resumen", title: "Gadget: Resumen", desc: "Vista compacta" },
    { href: "/gadgets/kpis", title: "Gadget: KPIs", desc: "Métricas principales" },
    { href: "/gadgets/estado", title: "Gadget: Estado", desc: "Estado de campañas" },
    { href: "/gadgets/publicaciones", title: "Gadget: Publicaciones", desc: "Planning y entregas" },
    { href: "/gadgets/actividad", title: "Gadget: Actividad", desc: "Timeline de eventos" },
    { href: "/gadgets/facturacion", title: "Gadget: Facturación", desc: "Pagos y balance" },
  ];

  const creatorMonetizationLinks: MenuLink[] = [
    { href: "/app/creator", title: "Centro de monetización", desc: "Resumen y rendimiento", tone: "primary" },
    { href: "/app/creator/channels", title: "Mis canales", desc: "Canales, estado y CTR" },
    { href: "/app/creator/precios", title: "Gestionar precios", desc: "Precio, categoría, verificación" },
    { href: "/app/creator/ingresos", title: "Cobros y facturación", desc: "Método de cobro y liquidaciones", badge: menuStats.creatorPayouts },
  ];
  const creatorOpsLinks: MenuLink[] = [
    { href: "/app/creator/inbox", title: "Solicitudes", desc: "Aceptar, rechazar, calendario", badge: menuStats.creatorPending },
    { href: "/app/creator/publicaciones", title: "Calendario", desc: "Próximas publicaciones", badge: menuStats.creatorUpcoming },
    { href: "/app/creator/kpis", title: "KPIs", desc: "Métricas agregadas y serie" },
    { href: "/app/creator/actividad", title: "Actividad", desc: "Timeline de eventos" },
  ];

  return (
    <div className={`private-layout ${quickOpen ? "with-quick" : ""}`}>
      <main className="content">{children}</main>
      <div className="quick-menu" aria-label="Menú">
        <button className="qm-btn" aria-expanded={quickOpen} onClick={() => setQuickOpen((v) => !v)}>Menú</button>
        {quickOpen && (
          <>
            <div className="qm-backdrop" onClick={() => setQuickOpen(false)} />
            <div className="qm-panel" role="menu">
              <div className="qm-head">
                <div>
                  <div className="qm-title">Menú</div>
                  <div className="qm-sub">{userEmail || "Cuenta"} · {role === "CHANNEL_ADMIN" ? "Creator" : role === "ADVERTISER" ? "Advertiser" : role}</div>
                </div>
                <button className="btn btn-icon btn-sm" onClick={() => setQuickOpen(false)}>✕</button>
              </div>

              {role === "ADVERTISER" && (
                <MenuSection title="Herramientas" links={advertiserLinks} pathname={pathname} onNavigate={() => setQuickOpen(false)} />
              )}
              {role === "CHANNEL_ADMIN" && (
                <>
                  <MenuSection title="Monetización" links={creatorMonetizationLinks} pathname={pathname} onNavigate={() => setQuickOpen(false)} />
                  <MenuSection title="Operación" links={creatorOpsLinks} pathname={pathname} onNavigate={() => setQuickOpen(false)} />
                </>
              )}
              {role === "OPS" && (
                <MenuSection
                  title="Herramientas"
                  links={[{ href: "/app/ops", title: "Panel OPS", desc: "Aprobar publicaciones y revisar tracking", tone: "primary" }]}
                  pathname={pathname}
                  onNavigate={() => setQuickOpen(false)}
                />
              )}

              <div className="qm-footer">
                <a className="btn btn-outline btn-sm" href="/" onClick={() => setQuickOpen(false)}>Inicio</a>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    clearToken();
                    router.replace("/login");
                  }}
                >
                  Salir
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="support-bubble" aria-label="Soporte">
        <button className="support-btn" onClick={() => setSupportOpen((v) => !v)}>¿Ayuda?</button>
        {supportOpen && (
          <div className="support-panel">
            <div className="spaced">
              <div><strong>Soporte</strong></div>
              <button className="btn btn-icon btn-sm" onClick={() => setSupportOpen(false)}>✕</button>
            </div>
            <p className="feature-desc">¿Tienes dudas? Escríbenos y te ayudamos.</p>
            <div className="form">
              <label className="label">
                Asunto
                <input className="input" placeholder="Breve descripción" value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} />
              </label>
              <label className="label">
                Mensaje
                <textarea className="textarea" placeholder="Cuéntanos qué necesitas" value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} />
              </label>
              <div className="row">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const subject = supportSubject.trim();
                    const body = supportMessage.trim();
                    if (!subject || !body) {
                      setSupportMsg("Completa asunto y mensaje");
                      return;
                    }
                    const to = "support@adflow.local";
                    const ctx = `\n\n---\nRuta: ${pathname}\nRol: ${role}\n`;
                    const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + ctx)}`;
                    window.location.href = url;
                    setSupportMsg("Abriendo correo…");
                    setTimeout(() => setSupportMsg(""), 2000);
                  }}
                >
                  Enviar
                </button>
                <a className="btn btn-outline btn-sm" href="/about">Ver contacto</a>
              </div>
              {supportMsg && <div className="badge">{supportMsg}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
 }
