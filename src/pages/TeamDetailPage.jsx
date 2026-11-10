import { useNavigate, useParams } from 'react-router-dom'
import { useTeamsContext } from '../context/TeamsContext'
import { penMeta } from '../mockData'
import './TeamDetailPage.css'

export default function TeamDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { teams, loading, toggleDogWalked } = useTeamsContext()

  const team = teams.find((t) => t.id === id)

  if (loading) {
    return <div className="detail-page"><p>Se încarcă...</p></div>
  }

  if (!team) {
    return (
      <div className="detail-page">
        <button className="detail-back" onClick={() => navigate(-1)}>← Înapoi</button>
        <p>Padocul nu a fost găsit.</p>
      </div>
    )
  }

  const meta = penMeta[team.pen]
  const walkedCount = team.dogs.filter((d) => d.walked).length
  const padocNumbers = team.idPadoc ? team.idPadoc.split('/').map((n) => n.trim()) : ['—']
  const anyFricos = team.dogs.some((d) => d.isFricos)

  return (
    <div className="detail-page">
      <button className="detail-back" onClick={() => navigate(-1)}>← Înapoi</button>

      <div className="detail-header">
        <div
          className={[
            'detail-badge',
            padocNumbers.length > 1 ? 'detail-badge-multi' : '',
            anyFricos ? 'detail-badge-warning' : 'detail-badge-calm',
          ].join(' ').trim()}
        >
          {padocNumbers.map((n) => (
            <span key={n} className="detail-badge-value">{n}</span>
          ))}
        </div>
        <div>
          <div className="detail-names">{team.namesRaw}</div>
          <div className="detail-pen">{meta?.label} • {walkedCount}/{team.dogs.length} scoși</div>
        </div>
      </div>

      <section className="dog-list">
        {team.dogs.map((dog) => (
          <div key={dog.name} className={['dog-row', dog.isFricos ? 'dog-row-warning' : ''].join(' ').trim()}>
            <div className="dog-row-main">
              <div className="dog-row-name">{dog.name}</div>
              <div className="dog-row-tags">
                {dog.isPrietenos && <span className="team-card-tag team-card-tag-ok">✓ Prietenos</span>}
                {dog.isFricos && <span className="team-card-tag team-card-tag-warning">⚠ Fricos</span>}
              </div>
              {dog.harness && (
                <div className="dog-row-harness">🦮 Ham: {dog.harness}</div>
              )}
              {dog.istoric && (
                <div className="dog-row-note">{dog.istoric}</div>
              )}
            </div>

            <button
              className={['dog-row-check', dog.walked ? 'dog-row-check-done' : ''].join(' ').trim()}
              onClick={() => toggleDogWalked(team.id, dog.rowNum)}
              aria-pressed={dog.walked}
              disabled={dog.rowNum === null}
            >
              <span className="dog-row-check-box">{dog.walked && <span className="dog-row-check-mark">✓</span>}</span>
              <span className="dog-row-check-label">{dog.walked ? 'SCOS' : 'ÎN AȘTEPTARE'}</span>
            </button>
          </div>
        ))}
      </section>
    </div>
  )
}
