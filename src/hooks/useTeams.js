import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchTeams, setWalked, canWrite } from '../api/sheets'

const POLL_MS = 20000

function todayKey() {
  return `dwb-walked-${new Date().toISOString().slice(0, 10)}`
}

function loadLocalOverrides() {
  try {
    const raw = localStorage.getItem(todayKey())
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveLocalOverrides(overrides) {
  try {
    localStorage.setItem(todayKey(), JSON.stringify(overrides))
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}

// Dog ids are keyed by their sheet row ("dog<rowNum>") so overrides survive
// re-fetches even though a team's own id ("row<n>") can shift.
function dogOverrideId(team, dog) {
  return dog.rowNum !== null ? `dog${dog.rowNum}` : `${team.id}:${dog.name}`
}

export function useTeams() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFallback, setIsFallback] = useState(false)
  const pollRef = useRef(null)

  const load = useCallback(async () => {
    const { teams: fetched, isFallback: fellBack } = await fetchTeams()
    const overrides = canWrite ? {} : loadLocalOverrides()
    const merged = fetched.map((t) => ({
      ...t,
      dogs: t.dogs.map((d) => {
        const key = dogOverrideId(t, d)
        return overrides[key] !== undefined ? { ...d, walked: overrides[key] } : d
      }),
    }))
    setTeams(merged)
    setIsFallback(fellBack)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    pollRef.current = setInterval(load, POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [load])

  const toggleDogWalked = useCallback(async (teamId, dogRowNum) => {
    let nextWalked
    let dogKey

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t
        return {
          ...t,
          dogs: t.dogs.map((d) => {
            if (d.rowNum !== dogRowNum) return d
            nextWalked = !d.walked
            dogKey = dogOverrideId(t, d)
            return { ...d, walked: nextWalked }
          }),
        }
      })
    )

    if (!canWrite) {
      const overrides = loadLocalOverrides()
      overrides[dogKey] = nextWalked
      saveLocalOverrides(overrides)
      return
    }

    const ok = await setWalked(`dog${dogRowNum}`, nextWalked)
    if (!ok) {
      setTeams((prev) =>
        prev.map((t) =>
          t.id !== teamId
            ? t
            : { ...t, dogs: t.dogs.map((d) => (d.rowNum === dogRowNum ? { ...d, walked: !nextWalked } : d)) }
        )
      )
    }
  }, [])

  return { teams, loading, isFallback, canWrite, toggleDogWalked }
}
