import { useState } from 'react'
import { APP_TITLE } from '../config.ts'
import { filesFromDataTransfer } from '../pipeline/drop.ts'
import type { SavedReading } from '../storage/idb.ts'

const ACCEPT = 'image/png,image/jpeg,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png'

async function snapshotFiles(list: FileList | File[]): Promise<{ kept: File[]; failed: number }> {
  const kept: File[] = []
  let failed = 0
  for (const file of [...list]) {
    try {
      const bytes = await file.arrayBuffer()
      kept.push(new File([bytes], file.name || 'picture', { type: file.type || '', lastModified: file.lastModified }))
    } catch (error) {
      failed += 1
      console.error('Lore failed during open', file.name, error)
    }
  }
  return { kept, failed }
}

export function Landing({
  saved,
  onFiles,
  onSample,
  onOpenSaved,
  onForgetSaved,
  onOpenError,
}: {
  saved: SavedReading | null
  onFiles: (files: File[], unreadable?: number) => void
  onSample: () => void
  onOpenSaved: () => void
  onForgetSaved: () => void
  onOpenError: (message: string) => void
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
        void filesFromDataTransfer(event.dataTransfer)
          .then((files) => snapshotFiles(files))
          .then(({ kept, failed }) => onFiles(kept, failed))
          .catch((error) => {
            console.error('Lore failed during open', error)
            onOpenError("Couldn't read that folder.")
          })
      }}
    >
      <h1 className="welcome-title">{APP_TITLE}</h1>
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
              const input = event.currentTarget
              const list = input.files
              if (!list || list.length === 0) return
              void snapshotFiles(list).then(({ kept, failed }) => {
                input.value = ''
                onFiles(kept, failed)
              })
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
              const input = event.currentTarget
              const list = input.files
              if (!list || list.length === 0) return
              void snapshotFiles(list).then(({ kept, failed }) => {
                input.value = ''
                onFiles(kept, failed)
              })
            }}
          />
        </label>
      </div>
      <p className="fine">Or drop screenshots here. Pictures that look private are skipped.</p>
      {dragging && <div className="drop-veil">Drop your screenshots</div>}
    </div>
  )
}
