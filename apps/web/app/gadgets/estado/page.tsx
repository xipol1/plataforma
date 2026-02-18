export default function GadgetEstadoPage() {
  return (
    <main className="container">
      <section className="card reveal">
        <h1 className="title">Mi estado</h1>
        <p className="subtitle">Resumen de tu cuenta y recomendaciones.</p>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-title">Verificación</div>
            <div className="stat-value">Completa</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Reputación</div>
            <div className="stat-value">Alta</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Alertas</div>
            <div className="stat-value">0</div>
          </div>
        </div>
        <h3 className="title" style={{ marginTop: "0.75rem" }}>Sugerencias</h3>
        <ul className="list">
          {["Activa 2 campañas esta semana", "Refuerza horario 12:00-14:00"].map((r, i) => (
            <li key={i} className="list-item">{r}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
