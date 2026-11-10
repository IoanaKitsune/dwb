import { useState } from 'react'
import './DogRow.css'

const COLLAPSED_LIMIT = 2

export default function DogRow({ dog, onToggleWalked, onAddComment }) {
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState('')

  const notes = dog.notes || []
  const visibleNotes = expanded ? notes : notes.slice(0, COLLAPSED_LIMIT)
  const hasMore = notes.length > COLLAPSED_LIMIT

  const submitComment = () => {
    const text = draft.trim()
    if (!text) return
    onAddComment(dog.rowNum, text)
    setDraft('')
  }

  return (
    <div className={['dog-row', dog.isFricos ? 'dog-row-warning' : ''].join(' ').trim()}>
      <div className="dog-row-main">
        <div className="dog-row-name">{dog.name}</div>
        <div className="dog-row-tags">
          {dog.isPrietenos && <span className="team-card-tag team-card-tag-ok">✓ Prietenos</span>}
          {dog.isFricos && <span className="team-card-tag team-card-tag-warning">⚠ Fricos</span>}
        </div>
        {dog.harness && <div className="dog-row-harness">🦮 Ham: {dog.harness}</div>}

        {visibleNotes.length > 0 && (
          <ul className="dog-row-notes">
            {visibleNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        )}

        {hasMore && (
          <button className="dog-row-show-more" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Arată mai puțin' : `Arată mai mult (${notes.length - COLLAPSED_LIMIT})`}
          </button>
        )}

        <div className="dog-row-add-comment">
          <input
            type="text"
            className="dog-row-comment-input"
            placeholder="Adaugă comentariu..."
            value={draft}
            disabled={dog.rowNum === null}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitComment()
            }}
          />
          <button
            className="dog-row-comment-add"
            onClick={submitComment}
            disabled={dog.rowNum === null || !draft.trim()}
            aria-label="Adaugă comentariu"
          />
        </div>
      </div>

      <button
        className={['dog-row-check', dog.walked ? 'dog-row-check-done' : ''].join(' ').trim()}
        onClick={() => onToggleWalked(dog.rowNum)}
        aria-pressed={dog.walked}
        disabled={dog.rowNum === null}
      >
        <span className="dog-row-check-box">{dog.walked && <span className="dog-row-check-mark">✓</span>}</span>
        <span className="dog-row-check-label">
          {dog.walked ? (dog.isFricos ? 'S-A STAT' : 'SCOS') : 'ÎN AȘTEPTARE'}
        </span>
      </button>
    </div>
  )
}
