import { useNavigate } from 'react-router-dom'
import './TeamCard.css'

export default function TeamCard({ team }) {
  const navigate = useNavigate()
  const { id, idPadoc, namesRaw, dogs } = team

  const anyFricos = dogs.some((d) => d.isFricos)
  const padocNumbers = idPadoc ? idPadoc.split('/').map((n) => n.trim()) : ['—']

  return (
    <div
      className={['team-card', anyFricos ? 'team-card-warning' : 'team-card-calm'].join(' ').trim()}
      onClick={() => navigate(`/team/${id}`)}
    >
      <div className={['team-card-badge', padocNumbers.length > 1 ? 'team-card-badge-multi' : ''].join(' ').trim()}>
        <span className="team-card-badge-label">PADOC</span>
        {padocNumbers.map((n) => (
          <span key={n} className="team-card-badge-value">{n}</span>
        ))}
      </div>

      <div className="team-card-body">
        <div className="team-card-name">{namesRaw}</div>

        <div className="team-card-tags">
          {dogs.some((d) => d.isPrietenos) && <span className="team-card-tag team-card-tag-ok">✓ Prietenos</span>}
          {anyFricos && <span className="team-card-tag team-card-tag-warning">⚠ Fricos</span>}
        </div>
      </div>

      <span className="team-card-chevron" aria-hidden="true">›</span>
    </div>
  )
}
