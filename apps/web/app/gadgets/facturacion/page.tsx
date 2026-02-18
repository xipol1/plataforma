export default function GadgetFacturacionPage() {
  const items = [
    { id: "pi_123", amount: 220, currency: "USD", status: "SUCCEEDED", ts: "2026-02-09" },
    { id: "pi_456", amount: 150, currency: "USD", status: "SUCCEEDED", ts: "2026-02-07" },
    { id: "pi_789", amount: 90, currency: "USD", status: "REFUNDED", ts: "2026-02-02" },
  ];
  const total = items.reduce((s, i) => s + (i.status === "SUCCEEDED" ? i.amount : 0), 0);
  return (
    <main className="container">
      <section className="card reveal">
        <h1 className="title">Facturación</h1>
        <p className="subtitle">Pagos, estados y sumario del periodo.</p>
        <div className="kpi-grid" style={{ marginBottom: "0.75rem" }}>
          <div className="kpi"><div className="label">Total pagado</div><div className="value">USD {total}</div></div>
          <div className="kpi"><div className="label">Pagos</div><div className="value">{items.length}</div></div>
          <div className="kpi"><div className="label">Reembolsos</div><div className="value">{items.filter(i => i.status === "REFUNDED").length}</div></div>
        </div>
        <ul className="list">
          {items.map((p) => (
            <li key={p.id} className="list-item">
              <div className="spaced">
                <div>
                  <strong>{p.id}</strong> · {p.ts}
                  <div className="muted">USD {p.amount} · {p.currency}</div>
                </div>
                <span className="badge">{p.status}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
