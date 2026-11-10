import { useMemo, useState } from 'react'
import Header from '../components/Header'
import PenTabs from '../components/PenTabs'
import PenToolbar from '../components/PenToolbar'
import TeamCard from '../components/TeamCard'
import { useTeamsContext } from '../context/TeamsContext'
import { penMeta } from '../mockData'

export default function TeamListPage() {
  const { teams, loading, isFallback, canWrite } = useTeamsContext()
  const [activePen, setActivePen] = useState('TARC1')
  const [onlyPending, setOnlyPending] = useState(false)

  const allDogs = useMemo(() => teams.flatMap((t) => t.dogs), [teams])
  const total = allDogs.length
  const walkedCount = allDogs.filter((d) => d.walked).length
  const waiting = total - walkedCount

  const counts = useMemo(() => {
    const c = {}
    for (const t of teams) c[t.pen] = (c[t.pen] || 0) + t.dogs.length
    return c
  }, [teams])

  const penTeams = useMemo(() => {
    const filtered = teams.filter((t) => t.pen === activePen)
    return onlyPending ? filtered.filter((t) => t.dogs.some((d) => !d.walked)) : filtered
  }, [teams, activePen, onlyPending])

  const activeMeta = penMeta[activePen]

  return (
    <>
      <Header total={total} walked={walkedCount} waiting={waiting} />

      <PenTabs penMeta={penMeta} counts={counts} active={activePen} onChange={setActivePen} />

      <main className="app-main">
        {isFallback && (
          <div style={{ fontSize: 11, color: 'var(--neutral-700)', textAlign: 'center', marginBottom: 10 }}>
            Mod demo — nu s-a putut citi foaia, se afișează date exemplu.
          </div>
        )}
        {!isFallback && !canWrite && (
          <div style={{ fontSize: 11, color: 'var(--primary-700)', textAlign: 'center', marginBottom: 10 }}>
            Mod doar-citire — bifele se salvează doar pe acest telefon.
          </div>
        )}

        <PenToolbar
          label={activeMeta?.label}
          activeCount={penTeams.length}
          onlyPending={onlyPending}
          onToggleOnlyPending={() => setOnlyPending((v) => !v)}
        />

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--neutral-700)' }}>Se încarcă...</p>
        ) : penTeams.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--neutral-700)' }}>Niciun padoc de afișat.</p>
        ) : (
          penTeams.map((team) => <TeamCard key={team.id} team={team} />)
        )}
      </main>
    </>
  )
}
