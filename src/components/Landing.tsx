import { useState } from 'react'
import { filesFromDataTransfer } from '../pipeline/drop.ts'
import type { SavedReading } from '../storage/idb.ts'

const ACCEPT = 'image/png,image/jpeg,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png'

export function Landing({
  saved,
  onFiles,
  onSample,
  onOpenSaved,
  onForgetSaved,
}: {
  saved: SavedReading | null
  onFiles: (files: File[]) => void
  onSample: () => void
  onOpenSaved: () => void
  onForgetSaved: () => void
}) {
  const [dragging, setDragging] = useState(false)

  return (
    <div
      className={dragging ? 'welcome is-dragging' : 'welcome'}
      onDragEnter={(event) => {
        if (![...event.dataTransfer.types].includes('Files')) return
        event.preventDefault()
        setDragging(true)
      }}
      onDragOver={(event) => {
        if (![...event.dataTransfer.types].includes('Files')) return
        event.preventDefault()
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        setDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        void filesFromDataTransfer(event.dataTransfer).then(onFiles)
      }}
    >
      <h1 className="welcome-title">Welcome to Lore</h1>
      <p className="welcome-lead">
        Lore turns your screenshots into a short <mark>portrait</mark> of what you care about.
      </p>
      <p className="body">Everything stays on your computer. Nothing is uploaded.</p>
      {saved && (
        <div className="saved-row">
          <button type="button" className="btn" onClick={onOpenSaved}>
            Open your last reading
          </button>
          <button type="button" className="btn" onClick={onForgetSaved}>
            Forget it
          </button>
        </div>
      )}
      <div className="welcome-actions">
        <label className="btn btn-primary roll-primary">
          <span>Start with my screenshots</span>
          <input
            id="shot-files"
            type="file"
            accept={ACCEPT}
            multiple
            onChange={(event) => {
              const list = event.target.files
              if (list && list.length > 0) onFiles([...list])
              event.target.value = ''
            }}
          />
        </label>
        <button type="button" className="btn" onClick={onSample}>
          Try sample screenshots
        </button>
        <label className="btn roll-folder">
          <span>Choose a folder</span>
          <input
            type="file"
            multiple
            ref={(node) => {
              if (node) node.setAttribute('webkitdirectory', '')
            }}
            onChange={(event) => {
              const list = event.target.files
              if (list && list.length > 0) onFiles([...list])
              event.target.value = ''
            }}
          />
        </label>
      </div>
      <p className="fine">Or drop screenshots here. Pictures that look private are skipped.</p>
      {dragging && <div className="drop-veil">Drop your screenshots</div>}
    </div>
  )
}
