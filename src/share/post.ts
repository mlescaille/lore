import { SHARE_URL } from '../config.ts'
import { downloadBlob } from './export.ts'

export const PICTURE_COPIED = 'Your picture is copied. Paste it into the post (Cmd+V).'
export const PICTURE_SAVED = 'Picture saved. Attach it to your post.'

export const LINKEDIN_COMPOSER = 'https://www.linkedin.com/feed/?shareActive=true'

export type SharePlatform = 'x' | 'threads' | 'linkedin' | 'instagram'

export interface LoreShareData {
  files: File[]
  text: string
  url: string
}

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

/** LinkedIn's feed composer. It cannot take a picture, so the PNG is copied first. */
export function linkedInComposer(): string {
  return LINKEDIN_COMPOSER
}

export function composerFor(platform: SharePlatform, text: string): string | null {
  if (platform === 'x') return xIntent(text)
  if (platform === 'threads') return threadsIntent(text)
  if (platform === 'linkedin') return linkedInComposer()
  return null
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

export interface FileShareEnv {
  share?: (data: LoreShareData) => Promise<void>
  canShare?: (data: { files: File[] }) => boolean
  write?: (items: ClipboardItem[]) => Promise<void>
  ClipboardItem?: typeof ClipboardItem
  download?: (blob: Blob, filename: string) => void
  open?: (url: string) => void
}

function shareFn(env: FileShareEnv): ((data: LoreShareData) => Promise<void>) | undefined {
  if (env.share) return env.share
  if (typeof navigator !== 'undefined' && navigator.share) return (data) => navigator.share(data)
  return undefined
}

function canShareFn(env: FileShareEnv): ((data: { files: File[] }) => boolean) | undefined {
  if (env.canShare) return env.canShare
  if (typeof navigator !== 'undefined' && navigator.canShare) return (data) => navigator.canShare(data)
  return undefined
}

function openComposer(url: string, env: FileShareEnv) {
  if (env.open) {
    env.open(url)
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Hand the selected picture to the system share sheet.
 * canShare is asked about the file only. The sheet also gets the post text and the Lore link.
 */
export async function shareWithFile(
  blob: Blob,
  filename: string,
  text: string,
  env: FileShareEnv = {},
): Promise<'shared' | 'aborted' | 'unavailable'> {
  const file = new File([blob], filename, { type: 'image/png' })
  const share = shareFn(env)
  const canShare = canShareFn(env)
  if (!share || !canShare) return 'unavailable'
  let allowed = false
  try {
    allowed = canShare({ files: [file] })
  } catch {
    allowed = false
  }
  if (!allowed) return 'unavailable'
  try {
    await share({ files: [file], text, url: SHARE_URL })
    return 'shared'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'aborted'
    console.error('Lore failed during share', error)
    return 'unavailable'
  }
}

/** Main button. The share sheet when it can take a file, otherwise the picture is copied or saved. */
export async function presentLore(
  blob: Blob,
  filename: string,
  text: string,
  env: FileShareEnv = {},
): Promise<'shared' | 'copied' | 'saved' | 'aborted'> {
  const outcome = await shareWithFile(blob, filename, text, env)
  if (outcome === 'shared' || outcome === 'aborted') return outcome
  return copyImage(blob, filename, env)
}

/**
 * A platform button. Prefer the share sheet with the file.
 * When the device cannot share files, the picture is copied or saved before any composer opens.
 * Instagram has no composer, so that fallback only saves the picture.
 */
export async function sharePlatform(
  platform: SharePlatform,
  blob: Blob,
  filename: string,
  text: string,
  env: FileShareEnv = {},
): Promise<'shared' | 'copied' | 'saved' | 'aborted'> {
  const outcome = await shareWithFile(blob, filename, text, env)
  if (outcome === 'shared' || outcome === 'aborted') return outcome
  if (platform === 'instagram') {
    ;(env.download ?? downloadBlob)(blob, filename)
    return 'saved'
  }
  const prepared = await copyImage(blob, filename, env)
  const href = composerFor(platform, text)
  if (href) openComposer(href, env)
  return prepared
}

export function pictureNotice(outcome: 'shared' | 'copied' | 'saved' | 'aborted'): string {
  if (outcome === 'copied') return PICTURE_COPIED
  if (outcome === 'saved') return PICTURE_SAVED
  return ''
}
