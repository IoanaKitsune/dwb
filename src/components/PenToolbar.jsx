import './PenToolbar.css'

export default function PenToolbar({ label, activeCount, onlyPending, onToggleOnlyPending }) {
  return (
    <div className="pen-toolbar">
      <div className="pen-toolbar-title">
        <span aria-hidden="true">🔒</span>
        <span className="pen-toolbar-title-main">{label}</span>
        {activeCount !== undefined && (
          <span className="pen-toolbar-title-sub">({activeCount} ture)</span>
        )}
      </div>
      <button
        className={['pen-toolbar-filter', onlyPending ? 'pen-toolbar-filter-active' : ''].join(' ').trim()}
        onClick={onToggleOnlyPending}
      >
        <span className="pen-toolbar-filter-dot" aria-hidden="true" /> Doar Nescoși
      </button>
    </div>
  )
}
