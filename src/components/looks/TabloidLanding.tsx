import type { SavedReading } from '../../storage/idb.ts'
import { DropZone, RollPicker } from './RollPicker.tsx'

export function TabloidLanding({
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
    <DropZone className="tb" onFiles={onFiles}>
      <header className="tb-mast">
        <span>Vol. I</span>
        <strong>The Daily Lore</strong>
        <span>No server</span>
      </header>
      <div className="tb-line">
        <span>Camera roll investigation</span>
        <span>Price: your dignity</span>
        <span>City edition</span>
      </div>
      <p className="tb-kicker">Exclusive</p>
      <h1 className="tb-title">
        Local person
        <br />
        screenshots
        <br />
        an entire
        <br />
        <em>personality</em>
      </h1>
      <p className="tb-dek">
        You name three themes. The pictures publish a correction. Nothing is uploaded, which slightly ruins the scandal.
      </p>
      {saved && (
        <div className="tb-saved">
          <p>Stop the presses: a reading is already saved on this device.</p>
          <button type="button" onClick={onOpenSaved}>
            Open it
          </button>
          <button type="button" onClick={onForgetSaved}>
            Spike it
          </button>
        </div>
      )}
      <RollPicker
        onFiles={onFiles}
        onSample={onSample}
        primary="Hand over the roll"
        sample="Read the Jules file"
        folder="or dump a folder"
      />
      <p className="tb-who">Jules Navarro, fictional, Portland. Caught planning Lisbon at midnight and saving dinners for a future self.</p>
      <ul className="tb-boxes">
        <li>
          <strong>0</strong>
          <span>uploads. We checked. There is nowhere to send them.</span>
        </li>
        <li>
          <strong>Out</strong>
          <span>Account numbers and clinic notes never make the story. Counts only.</span>
        </li>
        <li>
          <strong>500</strong>
          <span>shots a reading. After that, you pick the stretch.</span>
        </li>
      </ul>
      <details className="look-dates">
        <summary>A note on dates</summary>
        <p>
          We take the photo’s own time, then a date written into the filename, then the file date, which we mark as
          shaky. iPhones sometimes strip the original time on the way out of Photos. If the whole roll says today, the
          phone did that, not you.
        </p>
      </details>
    </DropZone>
  )
}
