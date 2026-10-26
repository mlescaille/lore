import type { SavedReading } from '../../storage/idb.ts'
import { DropZone, RollPicker } from './RollPicker.tsx'

export function ReceiptLanding({
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
    <DropZone className="rc" onFiles={onFiles}>
      <article className="rc-paper">
        <p className="rc-store">LORE</p>
        <p className="rc-meta">YOUR PHONE · NO SERVER · STILL OPEN</p>
        <p className="rc-rule" aria-hidden="true" />
        <h1 className="rc-title">
          YOUR YEAR
          <br />
          ITEMIZED
        </h1>
        <p className="rc-dek">Guess three themes. We print what you actually screenshot, with quantities.</p>
        <p className="rc-rule" aria-hidden="true" />
        {saved && (
          <div className="rc-saved">
            <p>PRIOR RECEIPT ON DEVICE</p>
            <button type="button" onClick={onOpenSaved}>
              REPRINT
            </button>
            <button type="button" onClick={onForgetSaved}>
              VOID
            </button>
          </div>
        )}
        <RollPicker onFiles={onFiles} onSample={onSample} primary="Print my year" sample="Sample receipt" folder="or a folder" />
        <p className="rc-rule" aria-hidden="true" />
        <ul className="rc-lines">
          <li>
            <span>UPLOADS</span>
            <span>0</span>
          </li>
          <li>
            <span>SECRETS IN THE STORY</span>
            <span>0</span>
          </li>
          <li>
            <span>SHOTS PER READING</span>
            <span>500</span>
          </li>
        </ul>
        <p className="rc-rule" aria-hidden="true" />
        <p className="rc-cashier">CASHIER: JULES NAVARRO (FICTIONAL, PORTLAND)</p>
        <p className="rc-thanks">THANK YOU FOR SCREENSHOTTING</p>
        <details className="look-dates">
          <summary>DATE SOURCE</summary>
          <p>
            Photo time, then the filename, then the file date, which we mark as shaky. iPhone Photos sometimes strips
            the original time. A roll that all says today was probably stripped on the way out.
          </p>
        </details>
      </article>
    </DropZone>
  )
}
