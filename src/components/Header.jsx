import './Header.css'

export default function Header({ total, walked, waiting }) {
  const pct = total > 0 ? Math.round((walked / total) * 100) : 0

  return (
    <header className="header">
      <div className="header-topbar">
        <div className="header-brand">
          <span className="header-logo" aria-hidden="true">🐾</span>
          <div>
            <div className="header-title">Dogs Without Borders</div>
          </div>
        </div>
      </div>

      <div className="progress-card">
        <div className="progress-card-top">
          <div>
            <div className="progress-count">{walked} / {total}</div>
            <div className="progress-count-label">CÂINI SCOȘI AZI</div>
          </div>
          <span className="progress-badge">{pct}% Gata</span>
        </div>

        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="stat-row">
          <div className="stat-chip stat-chip-total">
            <div className="stat-chip-label">TOTAL</div>
            <div className="stat-chip-value">{total}</div>
          </div>
          <div className="stat-chip stat-chip-walked">
            <div className="stat-chip-label">SCOȘI</div>
            <div className="stat-chip-value">{walked}</div>
          </div>
          <div className="stat-chip stat-chip-waiting">
            <div className="stat-chip-label">ÎN AȘTEPTARE</div>
            <div className="stat-chip-value">{waiting}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
