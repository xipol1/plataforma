export default function EscrowFlowSection() {
  return (
    <section className="container escrow-section">
      <div className="escrow-grid">
        <div className="escrow-content">
          <h2 className="escrow-title">Compra con garantía.</h2>
          <div className="escrow-copy">
            <p className="escrow-sub">El pago se retiene hasta que la publicación se confirma.</p>
            <ul className="escrow-list">
              <li className="escrow-item">
                <svg className="escrow-icon" viewBox="0 0 24 24">
                  <path d="M20 7l-10 10-4-4" />
                </svg>
                <span>Sin riesgo para el anunciante</span>
              </li>
              <li className="escrow-item">
                <svg className="escrow-icon" viewBox="0 0 24 24">
                  <path d="M20 7l-10 10-4-4" />
                </svg>
                <span>Liberación automática tras verificación</span>
              </li>
              <li className="escrow-item">
                <svg className="escrow-icon" viewBox="0 0 24 24">
                  <path d="M20 7l-10 10-4-4" />
                </svg>
                <span>Transparencia en cada estado</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="escrow-visual">
          <div className="escrow-panel">
            <div className="escrow-flow">
              <div className="escrow-state">
                <span className="state-tag">CAMPAÑA</span>
                <span className="state-name">Campaña creada</span>
                <span className="state-badge">Activa</span>
              </div>
              <div className="escrow-connector flow-connector flow-1">
                <div className="line" />
                <div className="dot" />
              </div>
              <div className="escrow-state active">
                <span className="state-tag">PAGO</span>
                <span className="state-name">Pago retenido</span>
                <span className="state-note">No se libera hasta confirmación</span>
                <span className="state-badge">
                  <span className="status-dot" aria-hidden="true" />
                  <span>En espera</span>
                </span>
              </div>
              <div className="escrow-connector flow-connector flow-2">
                <div className="line" />
                <div className="dot" />
              </div>
              <div className="escrow-state">
                <span className="state-tag">PUBLICACIÓN</span>
                <span className="state-name">Publicación confirmada</span>
                <span className="state-badge">Verificada</span>
              </div>
              <div className="escrow-connector flow-connector flow-3">
                <div className="line" />
                <div className="dot" />
              </div>
              <div className="escrow-state final">
                <span className="state-tag">LIQUIDACIÓN</span>
                <span className="state-name">Pago liberado</span>
                <span className="state-badge">Completado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
