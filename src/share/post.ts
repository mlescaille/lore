import { SHARE_URL } from '../config.ts'
import { downloadBlob } from './export.ts'

export const INSTAGRAM_SAVED = 'Image saved. Open Instagram and add it to your story.'

export function buildPostText(labels: string[], url = SHARE_URL): string {
  return `I found my lore: ${joinThemes(labels)}. Find yours: ${url}`
}

export function joinThemes(labels: string[]): string {
  const top = labels.map((label) => label.trim()).filter(Boolean).slice(0, 2)
  if (top.length === 0) return 'a few themes'
  if (top.length === 1) return top[0]
  return `${top[0]} and ${top[1]}`
}

/** X web intent. The query carries the post text and the Lore link, nothing else. */
export function xIntent(text: string, url = SHARE_URL): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}

/** Threads web intent. Threads has no separate url field, so the link stays in the text. */
export function threadsIntent(text: string): string {
  return `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`
}

/** LinkedIn share-offsite. LinkedIn takes the link only. */
export function linkedInIntent(url = SHARE_URL): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
}

export async function copyLink(
  url = SHARE_URL,
  writeText?: (value: string) => Promise<void>,
): Promise<'copied' | 'failed'> {
  try {
    const write = writeText ?? ((value: string) => navigator.clipboard.writeText(value))
    await write(url)
    return 'copied'
  } catch (error) {
    console.error('Lore failed during share', error)
    return 'failed'
  }
}

export interface ImageCopyEnv {
  write?: (items: ClipboardItem[]) => Promise<void>
  ClipboardItem?: typeof ClipboardItem
  download?: (blob: Blob, filename: string) => void
}

/** Puts the PNG on the clipboard. Downloads it when image copy is missing or refused. */
export async function copyImage(blob: Blob, filename: string, env: ImageCopyEnv = {}): Promise<'copied' | 'saved'> {
  const Item = env.ClipboardItem ?? (typeof ClipboardItem === 'undefined' ? undefined : ClipboardItem)
  const write = env.write ?? (typeof navigator !== 'undefined' ? navigator.clipboard?.write?.bind(navigator.clipboard) : undefined)
  if (Item && write) {
    try {
      await write([new Item({ 'image/png': blob })])
      return 'copied'
    } catch (error) {
      console.error('Lore failed during share', error)
    }
  }
  ;(env.download ?? downloadBlob)(blob, filename)
  return 'saved'
}

export interface FileShareData {
  files: File[]
  text?: string
}

export interface FileShareEnv {
  share?: (data: FileShareData) => Promise<void>
  canShare?: (data: FileShareData) => boolean
  download?: (blob: Blob, filename: string) => void
}

/**
 * Hand the picture to the system share sheet when it accepts files.
 * Otherwise save the file on this device. Nothing is uploaded by Lore.
 */
export async function shareImageFile(
  blob: Blob,
  filename: string,
  text: string | undefined,
  env: FileShareEnv = {},
): Promise<'shared' | 'saved' | 'aborted'> {
  const file = new File([blob], filename, { type: 'image/png' })
  const withText: FileShareData = text ? { files: [file], text } : { files: [file] }
  const filesOnly: FileShareData = { files: [file] }
  const share = env.share ?? (typeof navigator !== 'undefined' ? navigator.share?.bind(navigator) : undefined)
  const canShare = env.canShare ?? (typeof navigator !== 'undefined' ? navigator.canShare?.bind(navigator) : undefined)
  if (share && canShare) {
    const data = canShare(withText) ? withText : canShare(filesOnly) ? filesOnly : null
    if (data) {
      try {
        await share(data)
        return 'shared'
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return 'aborted'
        console.error('Lore failed during share', error)
      }
    }
  }
  ;(env.download ?? downloadBlob)(blob, filename)
  return 'saved'
}
