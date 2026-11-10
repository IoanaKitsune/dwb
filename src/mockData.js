export const mockTeams = [
  {
    id: 'row5', pen: 'TARC1', idPadoc: '', namesRaw: 'GLADYS / EINSTEIN / ERIN',
    names: ['GLADYS', 'EINSTEIN', 'ERIN'],
    dogs: [
      { name: 'GLADYS', rowNum: 5, harness: '1 x M-L', isPrietenos: true, isFricos: false, walked: false, istoric: 'Simparica 19.10 - Milprazon 29.06' },
      { name: 'EINSTEIN', rowNum: 6, harness: '1 x L-XL', isPrietenos: true, isFricos: false, walked: true, istoric: 'Simparica 19.10 - Milprazon 29.06' },
      { name: 'ERIN', rowNum: 7, harness: '1 x M', isPrietenos: false, isFricos: true, walked: false, istoric: 'Doar stat cu ea în padoc.' },
    ],
  },
  {
    id: 'row11', pen: 'TARC2', idPadoc: '', namesRaw: 'MONK / ZOPPA',
    names: ['MONK', 'ZOPPA'],
    dogs: [
      { name: 'MONK', rowNum: 26, harness: '1 x M-L', isPrietenos: false, isFricos: true, walked: false, istoric: 'Fără parizer direct din mână, moș morocănos.' },
      { name: 'ZOPPA', rowNum: 27, harness: '1 x M-L', isPrietenos: false, isFricos: true, walked: false, istoric: 'Simparica 19.10' },
    ],
  },
  {
    id: 'row19', pen: 'TARC3', idPadoc: '3', namesRaw: 'CARLOS',
    names: ['CARLOS'],
    dogs: [
      { name: 'CARLOS', rowNum: 43, harness: '1 x XL + botniță mărimea 6', isPrietenos: false, isFricos: true, walked: false, istoric: 'Botniță mărimea 6 obligatorie.' },
    ],
  },
  {
    id: 'row25', pen: 'FRICOSI', idPadoc: '18', namesRaw: 'DOMINO / CASSIOPEIA',
    names: ['DOMINO', 'CASSIOPEIA'],
    dogs: [
      { name: 'DOMINO', rowNum: 51, harness: '', isPrietenos: false, isFricos: true, walked: false, istoric: 'Furnizat parizer.' },
      { name: 'CASSIOPEIA', rowNum: 52, harness: '', isPrietenos: false, isFricos: true, walked: false, istoric: 'Furnizat parizer.' },
    ],
  },
]

export const penMeta = {
  TARC1: { label: 'ȚARC 1' },
  TARC2: { label: 'ȚARC 2' },
  TARC3: { label: 'ȚARC 3' },
  FRICOSI: { label: 'PADOC', warning: true },
  UNASSIGNED: { label: 'NESORTAȚI', warning: true },
}
