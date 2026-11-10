// Parses two separate tabs:
//   "Grupuri" (cols A-D): Țarc, Nr. Padoc, Căței în Padoc, Status
//   "Catei"   (cols A-F): Nume Câine, Nr. Padoc, Mărime Ham, Tip, A Fost Scos, Istoric / Note
//
// A group's "Nr. Padoc" can list more than one box ("10/33") when its dogs
// are split across boxes — so dogs are matched to their group primarily by
// box number (any of the group's numbers), not by name. Name matching is
// only a fallback for groups with no box number, since dog names aren't
// guaranteed unique (two different dogs can both be called "Lorien").

const G_COL = { TARC: 0, ID_PADOC: 1, CATEI_IN_PADOC: 2 }
const C_COL = { NAME: 0, ID_PADOC: 1, HARNESS: 2, TIP: 3, A_FOST_SCOS: 4, ISTORIC: 5 }

function normalizePen(raw) {
  const v = raw.trim().toLowerCase().replace(/[țţ]/g, 't').replace(/[șş]/g, 's')
  if (v === 'tarc 1') return 'TARC1'
  if (v === 'tarc 2') return 'TARC2'
  if (v === 'tarc 3') return 'TARC3'
  if (v === 'tarc special' || v === 'padoc') return 'FRICOSI'
  return null
}

// Full RFC4180-ish CSV parser (handles quoted fields, embedded commas,
// doubled "" escapes, and quoted newlines).
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let i = 0
  const len = text.length

  while (i < len) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      field += char
      i += 1
      continue
    }

    if (char === '"') {
      inQuotes = true
      i += 1
      continue
    }
    if (char === ',') {
      row.push(field)
      field = ''
      i += 1
      continue
    }
    if (char === '\r') {
      i += 1
      continue
    }
    if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i += 1
      continue
    }
    field += char
    i += 1
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

function cell(row, i) {
  const v = row[i]
  return v === undefined || v === null ? '' : String(v).trim()
}

function dash(v) {
  return v === '-' ? '' : v
}

function splitList(raw) {
  return raw
    .split('/')
    .map((n) => n.trim())
    .filter(Boolean)
}

function idPadocOf(dogs) {
  return [...new Set(dogs.map((d) => d.idPadoc).filter(Boolean))].join(' / ')
}

// "Catei" tab -> a flat, non-deduplicated list of dogs (names can repeat).
function buildDogList(rows) {
  const dogs = []

  rows.forEach((row, i) => {
    const name = dash(cell(row, C_COL.NAME))
    if (!name || name.toUpperCase() === 'TOTAL') return

    const tip = dash(cell(row, C_COL.TIP))
    // Guards against a stray header/summary row whose text landed in these
    // columns — a genuine dog row always has a real Tip value.
    if (!/prietenos|fricos/i.test(tip)) return

    dogs.push({
      name,
      rowNum: i + 1,
      idPadoc: dash(cell(row, C_COL.ID_PADOC)),
      harness: dash(cell(row, C_COL.HARNESS)),
      isPrietenos: /prietenos/i.test(tip),
      isFricos: /fricos/i.test(tip),
      walked: cell(row, C_COL.A_FOST_SCOS).toUpperCase() === 'TRUE',
      istoric: dash(cell(row, C_COL.ISTORIC)),
      matched: false,
    })
  })

  return dogs
}

export function buildTeams(grupuriRows, dogRows) {
  const allDogs = buildDogList(dogRows)
  const teams = []

  grupuriRows.forEach((row, i) => {
    const pen = normalizePen(cell(row, G_COL.TARC))
    if (!pen) return // header/summary rows, or anything unrecognized

    const idPadocField = dash(cell(row, G_COL.ID_PADOC))
    const padocNumbers = idPadocField ? splitList(idPadocField) : []

    let dogs = []
    if (padocNumbers.length > 0) {
      dogs = allDogs.filter((d) => !d.matched && d.idPadoc && padocNumbers.includes(d.idPadoc))
      dogs.forEach((d) => { d.matched = true })
    }

    if (dogs.length === 0) {
      // No box number to match on (or nothing matched it) — fall back to
      // matching by name against "Căței în Padoc".
      const namesRawField = dash(cell(row, G_COL.CATEI_IN_PADOC))
      if (!namesRawField) return
      const names = splitList(namesRawField)
      dogs = names.map((name) => {
        const found = allDogs.find((d) => !d.matched && d.name.toUpperCase() === name.toUpperCase())
        if (found) {
          found.matched = true
          return found
        }
        return {
          name,
          rowNum: null,
          idPadoc: '',
          harness: '',
          isPrietenos: false,
          isFricos: false,
          walked: false,
          istoric: '',
        }
      })
    }

    if (dogs.length === 0) return

    teams.push({
      id: `grp${i + 1}`,
      pen,
      idPadoc: idPadocOf(dogs),
      names: dogs.map((d) => d.name),
      namesRaw: dogs.map((d) => d.name).join(' / '),
      dogs,
    })
  })

  // Dogs in "Catei" that no "Grupuri" row ever claimed — don't drop them,
  // surface each as its own one-dog team in an "unassigned" pen instead.
  allDogs.forEach((dog) => {
    if (dog.matched) return
    teams.push({
      id: `unassigned-dog${dog.rowNum}`,
      pen: 'UNASSIGNED',
      idPadoc: idPadocOf([dog]),
      names: [dog.name],
      namesRaw: dog.name,
      dogs: [dog],
    })
  })

  return teams
}

export function parseSheetsCsv(grupuriText, dogsText) {
  return buildTeams(parseCsv(grupuriText), parseCsv(dogsText))
}
