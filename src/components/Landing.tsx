import { useState } from 'react'
import type { SavedReading } from '../storage/idb.ts'
import { Button } from './ui/button.tsx'
import { filesFromDataTransfer } from '../pipeline/drop.ts'

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
      className={dragging ? 'hero is-dragging' : 'hero'}
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
      <div className="hero-copy">
        <p className="eyebrow">A screenshot biography</p>
        <h1>
          Discover
          <br />
          your <em>lore</em>.
        </h1>
        <p className="dek">
          Your screenshots are a diary you didn’t agree to write. Guess the themes. Then meet what you actually kept.
        </p>
        {saved && (
          <div className="saved-banner">
            <p>A reading is saved on this device.</p>
            <div className="row">
              <Button size="sm" variant="paper" onClick={onOpenSaved}>
                Open it
              </Button>
              <Button size="sm" variant="quiet" onClick={onForgetSaved}>
                Forget it
              </Button>
            </div>
          </div>
        )}
        <div className="actions">
          <label className="file-btn">
            <span>Use my screenshots</span>
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
          <Button variant="ghost" size="lg" onClick={onSample}>
            Try the sample set
          </Button>
          <label className="folder-btn">
            <span>or choose a folder</span>
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
        <p className="sample-note">Jules Navarro · fictional · Portland. One year, too many open tabs.</p>
        <ul className="promises">
          <li>Nothing is uploaded</li>
          <li>Sensitive shots are dropped before the story</li>
          <li>Up to 500 a reading</li>
        </ul>
        <details className="fine-print">
          <summary>About dates</summary>
          <p>
            Lore reads the photo’s original time, then the date in the filename, then the file date. That last one is
            marked as less certain. On iPhone, the Photos picker sometimes strips the original time — worth knowing if
            every date says today.
          </p>
        </details>
        <div className="seal" aria-hidden="true">
          <strong>0</strong>
          <span>uploads</span>
        </div>
      </div>
      <div className="phones" aria-hidden="true">
        <div className="phone phone-a">
          <i />
          <b />
          <b />
          <b className="short" />
        </div>
        <div className="phone phone-b">
          <i />
          <b />
          <b className="short" />
          <b />
        </div>
        <div className="phone phone-c">
          <i />
          <b />
          <b />
          <b className="short" />
        </div>
        <p>A year, in pictures you forgot you kept.</p>
      </div>
      {dragging && <div className="drop-veil">Drop the camera roll</div>}
    </div>
  )
}
