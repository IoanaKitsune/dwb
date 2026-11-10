import { parseSheetsCsv } from './parseSheet'
import { mockTeams } from '../mockData'

// Preferred: a Google Apps Script Web App bound to the sheet (read + write).
// See apps-script/Code.gs and README.md for how to deploy one.
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL

// Fallback: plain CSV export of the two tabs (read-only, no write-back).
const SHEET_ID = '15zq7c-YylUIGYswybAEOQMeVkYIRaz7ff8NxWPzoQ5Q'
const csvUrlFor = (sheetName) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
const GRUPURI_CSV_URL = import.meta.env.VITE_GRUPURI_CSV_URL || csvUrlFor('Grupuri')
const CATEI_CSV_URL = import.meta.env.VITE_CATEI_CSV_URL || csvUrlFor('Catei')

export const canWrite = Boolean(APPS_SCRIPT_URL)

export async function fetchTeams() {
  if (APPS_SCRIPT_URL) {
    try {
      const res = await fetch(APPS_SCRIPT_URL)
      if (!res.ok) throw new Error(`Apps Script fetch failed: ${res.status}`)
      const { teams } = await res.json()
      if (!teams || teams.length === 0) throw new Error('Apps Script returned no teams')
      return { teams, isFallback: false }
    } catch (e) {
      console.warn('Apps Script read failed, trying CSV fallback:', e.message)
    }
  }

  try {
    const [grupuriRes, dogsRes] = await Promise.all([fetch(GRUPURI_CSV_URL), fetch(CATEI_CSV_URL)])
    if (!grupuriRes.ok || !dogsRes.ok) throw new Error('Sheet fetch failed')
    const [grupuriText, dogsText] = await Promise.all([grupuriRes.text(), dogsRes.text()])
    const teams = parseSheetsCsv(grupuriText, dogsText)
    if (teams.length === 0) throw new Error('Sheet returned no teams')
    return { teams, isFallback: false }
  } catch (e) {
    console.warn('Falling back to demo data:', e.message)
    return { teams: mockTeams, isFallback: true }
  }
}

export async function setWalked(id, walked) {
  if (!APPS_SCRIPT_URL) return false
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: new URLSearchParams({ id, walked: String(walked) }),
    })
    if (!res.ok) throw new Error(`Apps Script write failed: ${res.status}`)
    const data = await res.json()
    return Boolean(data.success)
  } catch (e) {
    console.warn('Apps Script write failed:', e.message)
    return false
  }
}

// Returns the updated notes array on success, or null on failure/unsupported.
export async function addComment(id, text) {
  if (!APPS_SCRIPT_URL) return null
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: new URLSearchParams({ id, comment: text }),
    })
    if (!res.ok) throw new Error(`Apps Script write failed: ${res.status}`)
    const data = await res.json()
    return data.success ? data.notes : null
  } catch (e) {
    console.warn('Apps Script comment write failed:', e.message)
    return null
  }
}
