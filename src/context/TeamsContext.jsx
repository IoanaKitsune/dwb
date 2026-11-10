import { createContext, useContext } from 'react'
import { useTeams } from '../hooks/useTeams'

const TeamsContext = createContext(null)

export function TeamsProvider({ children }) {
  const value = useTeams()
  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
}

export function useTeamsContext() {
  const ctx = useContext(TeamsContext)
  if (!ctx) throw new Error('useTeamsContext must be used within TeamsProvider')
  return ctx
}
