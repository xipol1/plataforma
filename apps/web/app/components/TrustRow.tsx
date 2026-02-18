export default function TrustRow() {
  return (
    <section className="container trust-section">
      <div className="trust-row">
        <div className="trust-item">
          <span className="trust-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M20 7l-10 10-4-4" />
            </svg>
          </span>
          <span>Pago protegido hasta confirmación</span>
        </div>
        <div className="trust-item">
          <span className="trust-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M20 7l-10 10-4-4" />
            </svg>
          </span>
          <span>Publicación verificada</span>
        </div>
        <div className="trust-item">
          <span className="trust-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M20 7l-10 10-4-4" />
            </svg>
          </span>
          <span>Métricas claras y visibles</span>
        </div>
      </div>
    </section>
  );
}
