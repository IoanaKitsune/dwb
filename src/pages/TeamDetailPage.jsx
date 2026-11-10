import { useNavigate, useParams } from 'react-router-dom'
import { useTeamsContext } from '../context/TeamsContext'
import DogRow from '../components/DogRow'
import { penMeta } from '../mockData'
import './TeamDetailPage.css'

export default function TeamDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { teams, loading, toggleDogWalked, addComment } = useTeamsContext()

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
          <DogRow
            key={dog.name}
            dog={dog}
            onToggleWalked={(rowNum) => toggleDogWalked(team.id, rowNum)}
            onAddComment={(rowNum, text) => addComment(team.id, rowNum, text)}
          />
        ))}
      </section>
    </div>
  )
}
