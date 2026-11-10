// Deploy this bound to your Google Sheet: Extensions > Apps Script, paste
// this file's contents in as Code.gs, then Deploy > New deployment > Web app
// (Execute as: Me, Who has access: Anyone). See ../README.md for full steps.
//
// Mirrors src/api/parseSheet.js — keep the two in sync if the sheet layout
// changes. Reads two separate tabs:
//   "Grupuri" (cols A-D): Țarc, Nr. Padoc, Căței în Padoc, Status
//   "Catei"   (cols A-F): Nume Câine, Nr. Padoc, Mărime Ham, Tip, A Fost Scos, Istoric / Note
//
// A group's "Nr. Padoc" can list more than one box ("10/33") when its dogs
// are split across boxes — so dogs are matched to their group primarily by
// box number (any of the group's numbers), not by name. Name matching is
// only a fallback for groups with no box number, since dog names aren't
// guaranteed unique. The walked checkbox is per-dog, writing directly to
// that dog's own row in "Catei" (id "dog<rowNum>").

var GRUPURI_SHEET = 'Grupuri'
var CATEI_SHEET = 'Catei'

var G_COL = { TARC: 0, ID_PADOC: 1, CATEI_IN_PADOC: 2 }
var C_COL = { NAME: 0, ID_PADOC: 1, HARNESS: 2, TIP: 3, A_FOST_SCOS: 4, ISTORIC: 5 }

function normalizePen(raw) {
  var v = raw.trim().toLowerCase().replace(/[țţ]/g, 't').replace(/[șş]/g, 's')
  if (v === 'tarc 1') return 'TARC1'
  if (v === 'tarc 2') return 'TARC2'
  if (v === 'tarc 3') return 'TARC3'
  if (v === 'tarc special' || v === 'padoc') return 'FRICOSI'
  return null
}

function cell(row, i) {
  var v = row[i]
  return v === null || v === undefined ? '' : String(v).trim()
}

function dash(v) {
  return v === '-' ? '' : v
}

function splitList(raw) {
  return raw
    .split('/')
    .map(function (n) { return n.trim() })
    .filter(function (n) { return n.length > 0 })
}

function idPadocOf(dogs) {
  var seen = {}
  var parts = []
  dogs.forEach(function (d) {
    if (d.idPadoc && !seen[d.idPadoc]) {
      seen[d.idPadoc] = true
      parts.push(d.idPadoc)
    }
  })
  return parts.join(' / ')
}

// New comments are appended as their own line, so each line is one entry.
function notesOf(istoric) {
  if (!istoric) return []
  return istoric.split('\n').map(function (n) { return n.trim() }).filter(function (n) { return n.length > 0 })
}

function buildDogList(rows) {
  var dogs = []

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i]
    var name = dash(cell(row, C_COL.NAME))
    if (!name || name.toUpperCase() === 'TOTAL') continue

    var tip = dash(cell(row, C_COL.TIP))
    if (!/prietenos|fricos/i.test(tip)) continue

    var istoric = dash(cell(row, C_COL.ISTORIC))

    dogs.push({
      name: name,
      rowNum: i + 1,
      idPadoc: dash(cell(row, C_COL.ID_PADOC)),
      harness: dash(cell(row, C_COL.HARNESS)),
      isPrietenos: /prietenos/i.test(tip),
      isFricos: /fricos/i.test(tip),
      walked: cell(row, C_COL.A_FOST_SCOS).toUpperCase() === 'TRUE',
      istoric: istoric,
      notes: notesOf(istoric),
      matched: false,
    })
  }

  return dogs
}

function buildTeams(grupuriRows, dogRows) {
  var allDogs = buildDogList(dogRows)
  var teams = []

  for (var i = 0; i < grupuriRows.length; i++) {
    var row = grupuriRows[i]
    var pen = normalizePen(cell(row, G_COL.TARC))
    if (!pen) continue

    var idPadocField = dash(cell(row, G_COL.ID_PADOC))
    var padocNumbers = idPadocField ? splitList(idPadocField) : []

    var dogs = []
    if (padocNumbers.length > 0) {
      dogs = allDogs.filter(function (d) {
        return !d.matched && d.idPadoc && padocNumbers.indexOf(d.idPadoc) !== -1
      })
      dogs.forEach(function (d) { d.matched = true })
    }

    if (dogs.length === 0) {
      var namesRawField = dash(cell(row, G_COL.CATEI_IN_PADOC))
      if (!namesRawField) continue
      var names = splitList(namesRawField)
      dogs = names.map(function (name) {
        var found = null
        for (var j = 0; j < allDogs.length; j++) {
          if (!allDogs[j].matched && allDogs[j].name.toUpperCase() === name.toUpperCase()) {
            found = allDogs[j]
            break
          }
        }
        if (found) {
          found.matched = true
          return found
        }
        return {
          name: name,
          rowNum: null,
          idPadoc: '',
          harness: '',
          isPrietenos: false,
          isFricos: false,
          walked: false,
          istoric: '',
          notes: [],
        }
      })
    }

    if (dogs.length === 0) continue

    teams.push({
      id: 'grp' + (i + 1),
      pen: pen,
      idPadoc: idPadocOf(dogs),
      names: dogs.map(function (d) { return d.name }),
      namesRaw: dogs.map(function (d) { return d.name }).join(' / '),
      dogs: dogs,
    })
  }

  // Dogs in "Catei" that no "Grupuri" row ever claimed — don't drop them,
  // surface each as its own one-dog team in an "unassigned" pen instead.
  allDogs.forEach(function (dog) {
    if (dog.matched) return
    teams.push({
      id: 'unassigned-dog' + dog.rowNum,
      pen: 'UNASSIGNED',
      idPadoc: idPadocOf([dog]),
      names: [dog.name],
      namesRaw: dog.name,
      dogs: [dog],
    })
  })

  return teams
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  )
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var grupuriRows = ss.getSheetByName(GRUPURI_SHEET).getDataRange().getValues()
  var dogRows = ss.getSheetByName(CATEI_SHEET).getDataRange().getValues()
  return jsonOutput({ teams: buildTeams(grupuriRows, dogRows) })
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CATEI_SHEET)

  if (e.parameter.action === 'resetAll') {
    var rows = sheet.getDataRange().getValues()
    var dogs = buildDogList(rows)
    dogs.forEach(function (d) {
      sheet.getRange(d.rowNum, C_COL.A_FOST_SCOS + 1).setValue('FALSE')
    })
    return jsonOutput({ success: true, count: dogs.length })
  }

  var id = e.parameter.id
  var match = /^dog(\d+)$/.exec(id || '')
  if (!match) {
    return jsonOutput({ success: false, error: 'invalid id' })
  }
  var rowNum = parseInt(match[1], 10)

  if (e.parameter.comment !== undefined) {
    var comment = e.parameter.comment.trim()
    if (!comment) return jsonOutput({ success: false, error: 'empty comment' })

    var istoricCell = sheet.getRange(rowNum, C_COL.ISTORIC + 1)
    var existing = dash(String(istoricCell.getValue() || '').trim())
    var updated = existing ? existing + '\n' + comment : comment
    istoricCell.setValue(updated)

    return jsonOutput({ success: true, istoric: updated, notes: notesOf(updated) })
  }

  var walked = e.parameter.walked === 'true'
  // C_COL.A_FOST_SCOS is 0-based index 4 -> column E -> 1-based column 5
  sheet.getRange(rowNum, C_COL.A_FOST_SCOS + 1).setValue(walked ? 'TRUE' : 'FALSE')

  return jsonOutput({ success: true })
}
