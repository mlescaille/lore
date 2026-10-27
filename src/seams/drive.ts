/**
 * Next version: save a card or data.json to Google Drive.
 * Needs a Google Cloud project and a consent screen.
 * Scope should be drive.file — only files Lore creates, not the user's Drive.
 * Not built in v1.
 */
export interface DriveExporter {
  save(filename: string, blob: Blob): Promise<void>
}

export function googleDriveExporter(): DriveExporter {
  return {
    save() {
      return Promise.reject(new Error('Google Drive export is not in v1.'))
    },
  }
}
