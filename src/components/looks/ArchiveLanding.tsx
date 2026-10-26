import type { SavedReading } from '../../storage/idb.ts'
import { DropZone, RollPicker } from './RollPicker.tsx'

export function ArchiveLanding({
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
  return (
    <DropZone className="ar" onFiles={onFiles}>
      <div className="ar-copy">
        <p className="ar-acc">Lore Museum of Attention · Acc. —</p>
        <h1 className="ar-title">You are the exhibit.</h1>
        <p className="ar-dek">
          Name three themes. We accession the screenshots, write the label, and keep a curator’s note that is polite only up to a point.
        </p>
        {saved && (
          <div className="ar-saved">
            <p>A previous case is still in storage on this device.</p>
            <button type="button" onClick={onOpenSaved}>
              Retrieve it
            </button>
            <button type="button" onClick={onForgetSaved}>
              Deaccession
            </button>
          </div>
        )}
        <RollPicker
          onFiles={onFiles}
          onSample={onSample}
          primary="Submit my objects"
          sample="Open the sample case"
          folder="or a folder of objects"
        />
        <p className="ar-who">Sample case: Jules Navarro, invented, Portland, one year.</p>
        <dl className="ar-facts">
          <div>
            <dt>Medium</dt>
            <dd>Screenshots, denial</dd>
          </div>
          <div>
            <dt>Uploads</dt>
            <dd>None. There is no gallery offsite.</dd>
          </div>
          <div>
            <dt>Limit</dt>
            <dd>500 objects. Sensitive ones are not displayed. Only a count remains.</dd>
          </div>
        </dl>
        <details className="look-dates">
          <summary>On dates</summary>
          <p>
            The accession date is the photo’s own time, then a date in the filename, then the file’s modified time,
            which we flag. The iPhone Photos picker sometimes drops the original time.
          </p>
        </details>
      </div>
      <aside className="ar-case" aria-hidden="true">
        <p>Case 01</p>
        <div className="ar-void">
          <span>Empty</span>
          <span>until the guess</span>
        </div>
        <p>Please do not touch the glass. There is no glass.</p>
      </aside>
    </DropZone>
  )
}
