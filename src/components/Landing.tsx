import { useState } from 'react'
import { filesFromDataTransfer } from '../pipeline/drop.ts'
import type { SavedReading } from '../storage/idb.ts'
import { TitleBar } from './Window.tsx'

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
      className={dragging ? 'stage is-dragging' : 'stage'}
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
      <section className="win setup">
        <TitleBar title="LORE" />
        <div className="win-body">
          <h1 className="pixel-title">Drop in your screenshots</h1>
          <p className="body">Lore finds what you keep saving, then shows you a short portrait of you.</p>
          {saved && (
            <div className="saved-row">
              <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenSaved}>
                Open your last reading
              </button>
              <button type="button" className="btn btn-quiet btn-sm" onClick={onForgetSaved}>
                Forget it
              </button>
            </div>
          )}
          <div className="roll-actions">
            <label className="roll-primary">
              <span>Choose screenshots</span>
              <input
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
            <button type="button" className="roll-sample" onClick={onSample}>
              Try the sample
            </button>
            <label className="roll-folder">
              <span>or a folder</span>
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
          <p className="fine">Nothing is uploaded. Pictures that look private are skipped.</p>
        </div>
      </section>
      {dragging && <div className="drop-veil">Drop your screenshots</div>}
    </div>
  )
}
