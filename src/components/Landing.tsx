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
        <TitleBar title="LORE SETUP" />
        <div className="win-body">
          <p className="kicker">STEP 1 OF 2 · ADMIT THE FOLDER</p>
          <h1 className="pixel-title">
            This installer has opinions.
            <span className="cursor" aria-hidden="true" />
          </h1>
          <p className="body">Guess three themes. Then it opens the pictures and tells you what you actually kept.</p>
          <div className="install-bar is-demo" role="img" aria-label="Waiting for a folder">
            <span>
              <i />
            </span>
          </div>
          <p className="status-line">Asking nicely before opening the folder…</p>
          {saved && (
            <div className="saved-row">
              <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenSaved}>
                Open last file
              </button>
              <button type="button" className="btn btn-quiet btn-sm" onClick={onForgetSaved}>
                Delete
              </button>
            </div>
          )}
          <div className="roll-actions">
            <button type="button" className="roll-sample" onClick={onSample}>
              Load sample
            </button>
            <label className="roll-primary">
              <span>My screenshots</span>
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
          <ul className="facts">
            <li>0 files leave this machine</li>
            <li>Sensitive shots are skipped</li>
            <li>500, then the wizard stops</li>
          </ul>
          <p className="fine">Sample disk: Jules Navarro, fictional, Portland.</p>
          <details className="dates">
            <summary>About dates</summary>
            <p>
              Photo time, then filename, then the file date, which we flag. iPhones sometimes strip the original time on
              the way out of Photos.
            </p>
          </details>
        </div>
      </section>
      {dragging && <div className="drop-veil">Drop the camera roll</div>}
    </div>
  )
}
