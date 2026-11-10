import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchTeams, setWalked, addComment as addCommentApi, canWrite } from '../api/sheets'

const POLL_MS = 20000
const COMMENTS_KEY = 'dwb-comments' // not date-scoped — comments are permanent, unlike "walked today"

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

function loadLocalComments() {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveLocalComments(comments) {
  try {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments))
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
    const walkedOverrides = canWrite ? {} : loadLocalOverrides()
    const commentOverrides = canWrite ? {} : loadLocalComments()
    const merged = fetched.map((t) => ({
      ...t,
      dogs: t.dogs.map((d) => {
        const key = dogOverrideId(t, d)
        const walked = walkedOverrides[key] !== undefined ? walkedOverrides[key] : d.walked
        const extraNotes = commentOverrides[key] || []
        // d.notes may be missing if the Apps Script deployment predates the
        // comments feature — don't crash the whole app merge over it.
        return { ...d, walked, notes: [...(d.notes || []), ...extraNotes] }
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

  // nextWalked/dogKey are derived from `teams` *before* calling setTeams —
  // a state updater's own body isn't guaranteed to have run yet by the time
  // the next line of this function executes, so capturing values via a
  // side effect inside it (as this used to do) can read them as undefined.
  // That previously sent `walked=undefined` to Apps Script (-> false),
  // which looked fine optimistically but reverted on the next poll because
  // the sheet was never actually updated.
  const toggleDogWalked = useCallback(async (teamId, dogRowNum) => {
    const team = teams.find((t) => t.id === teamId)
    const dog = team?.dogs.find((d) => d.rowNum === dogRowNum)
    if (!dog) return

    const nextWalked = !dog.walked
    const dogKey = dogOverrideId(team, dog)

    setTeams((prev) =>
      prev.map((t) =>
        t.id !== teamId
          ? t
          : { ...t, dogs: t.dogs.map((d) => (d.rowNum === dogRowNum ? { ...d, walked: nextWalked } : d)) }
      )
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
  }, [teams])

  const addComment = useCallback(async (teamId, dogRowNum, text) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const team = teams.find((t) => t.id === teamId)
    const dog = team?.dogs.find((d) => d.rowNum === dogRowNum)
    if (!dog) return
    const dogKey = dogOverrideId(team, dog)

    setTeams((prev) =>
      prev.map((t) =>
        t.id !== teamId
          ? t
          : { ...t, dogs: t.dogs.map((d) => (d.rowNum === dogRowNum ? { ...d, notes: [...d.notes, trimmed] } : d)) }
      )
    )

    if (!canWrite) {
      const comments = loadLocalComments()
      comments[dogKey] = [...(comments[dogKey] || []), trimmed]
      saveLocalComments(comments)
      return
    }

    const notes = await addCommentApi(`dog${dogRowNum}`, trimmed)
    if (!notes) {
      setTeams((prev) =>
        prev.map((t) =>
          t.id !== teamId
            ? t
            : {
                ...t,
                dogs: t.dogs.map((d) =>
                  d.rowNum === dogRowNum ? { ...d, notes: d.notes.filter((n) => n !== trimmed) } : d
                ),
              }
        )
      )
    }
  }, [teams])

  return { teams, loading, isFallback, canWrite, toggleDogWalked, addComment }
}
