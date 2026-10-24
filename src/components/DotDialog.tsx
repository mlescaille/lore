import { formatDay } from '../lib/format.ts'
import type { ShotRecord, Theme } from '../types.ts'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from './ui/dialog.tsx'

export function DotDialog({
  record,
  theme,
  imageUrl,
  showImages,
  onShowImages,
  onClose,
}: {
  record: ShotRecord | null
  theme: Theme | undefined
  imageUrl: string | null
  showImages: boolean
  onShowImages: (on: boolean) => void
  onClose: () => void
}) {
  return (
    <Dialog open={Boolean(record)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {record && (
          <>
            <DialogTitle className="sheet-title">{theme?.label ?? 'Screenshot'}</DialogTitle>
            <DialogDescription className="sheet-date">
              {formatDay(record.timestamp)}
              {record.timestampSource === 'lastModified' ? ' · file date, less certain' : ''}
              {record.timestampSource === 'filename' ? ' · from the filename' : ''}
              {record.timestampSource === 'exif' ? ' · from the photo' : ''}
            </DialogDescription>
            <label className="switch">
              <input type="checkbox" checked={showImages} onChange={(event) => onShowImages(event.target.checked)} />
              <span>Show the screenshot</span>
            </label>
            {showImages && imageUrl && <img className="shot" src={imageUrl} alt="" />}
            {showImages && !imageUrl && <p className="note">This reading doesn’t have the image anymore. The text is what we kept.</p>}
            <p className="ocr">{record.text.trim() || 'No words in this one. Just the picture.'}</p>
            <DialogClose className="text-close">Close</DialogClose>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
