import { useState, type ReactNode } from 'react'
import { filesFromDataTransfer } from '../../pipeline/drop.ts'

const ACCEPT = 'image/png,image/jpeg,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png'

export function DropZone({
  className,
  onFiles,
  children,
}: {
  className: string
  onFiles: (files: File[]) => void
  children: ReactNode
}) {
  const [dragging, setDragging] = useState(false)

  return (
    <div
      className={dragging ? `${className} is-dragging` : className}
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
      {children}
      {dragging && <div className="look-drop">Drop the camera roll</div>}
    </div>
  )
}

export function RollPicker({
  onFiles,
  onSample,
  primary,
  sample,
  folder,
}: {
  onFiles: (files: File[]) => void
  onSample: () => void
  primary: string
  sample: string
  folder: string
}) {
  return (
    <div className="roll-actions">
      <label className="roll-primary">
        <span>{primary}</span>
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
        {sample}
      </button>
      <label className="roll-folder">
        <span>{folder}</span>
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
  )
}
