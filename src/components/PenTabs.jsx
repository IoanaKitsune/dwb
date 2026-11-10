import './PenTabs.css'

const PEN_ORDER = ['TARC1', 'TARC2', 'TARC3', 'FRICOSI', 'UNASSIGNED']

export default function PenTabs({ penMeta, counts, active, onChange }) {
  return (
    <nav className="pen-tabs" role="tablist" aria-label="Țarcuri">
      {PEN_ORDER.map((key) => {
        // Only show "Nesortați" once it actually has dogs in it.
        if (key === 'UNASSIGNED' && !counts[key]) return null
        const meta = penMeta[key]
        if (!meta) return null
        const isActive = key === active
        const isWarning = meta.warning
        const count = counts[key] || 0
        return (
          <button
            key={key}
            role="tab"
            aria-selected={isActive}
            className={[
              'pen-tab',
              isActive ? 'pen-tab-active' : '',
              isWarning ? 'pen-tab-warning' : '',
            ].join(' ').trim()}
            onClick={() => onChange(key)}
          >
            <span className="pen-tab-label">
              {isWarning && <span aria-hidden="true">⚠️</span>} {meta.label}
            </span>
            <span className="pen-tab-sub">{count} câini</span>
          </button>
        )
      })}
    </nav>
  )
}
