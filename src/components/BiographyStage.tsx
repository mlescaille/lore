import { useEffect, useRef, useState } from 'react'
import { cardPixels, defaultShareSize, shareCardFromResult, type CardSize } from '../share/card.ts'
import { cardToBlob } from '../share/export.ts'
import {
  buildPostText,
  copyImage,
  copyLink,
  pictureNotice,
  presentLore,
  sharePlatform,
  type SharePlatform,
} from '../share/post.ts'
import type { ScoreResult } from '../pipeline/scoring.ts'
import type { LoreResult } from '../types.ts'
import { CardFace } from './CardFace.tsx'
import { Button } from './ui/button.tsx'

function filenameFor(size: CardSize): string {
  return size === 'story' ? 'lore-story.png' : 'lore-square.png'
}

export function BiographyStage({
  result,
  score,
  guessed,
}: {
  result: LoreResult
  score: ScoreResult | null
  guessed: boolean
}) {
  const [size, setSize] = useState<CardSize>(() =>
    defaultShareSize(typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches),
  )
  const [width, setWidth] = useState(640)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const frameRef = useRef<HTMLDivElement>(null)
  const squareRef = useRef<HTMLDivElement>(null)
  const storyRef = useRef<HTMLDivElement>(null)
  const preview = shareCardFromResult(result, score, guessed, size)
  const squareModel = shareCardFromResult(result, score, guessed, 'square')
  const storyModel = shareCardFromResult(result, score, guessed, 'story')
  const pixels = cardPixels(size)
  const scale = Math.min(1, width / pixels.width)
  const frameHeight = pixels.height * scale
  const postText = buildPostText(preview.themes)

  useEffect(() => {
    const node = frameRef.current
    if (!node) return
    const observer = new ResizeObserver(() => setWidth(node.clientWidth))
    observer.observe(node)
    setWidth(node.clientWidth)
    return () => observer.disconnect()
  }, [])

  async function png(which: CardSize) {
    const node = which === 'story' ? storyRef.current : squareRef.current
    if (!node) throw new Error('Card is not ready')
    return cardToBlob(node)
  }

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setNotice('')
    try {
      await action()
    } catch (error) {
      console.error('Lore failed during share', error)
      setNotice('Could not build the image. You can still copy the link.')
    } finally {
      setBusy(false)
    }
  }

  function show(outcome: 'shared' | 'copied' | 'saved' | 'aborted') {
    const message = pictureNotice(outcome)
    if (message) setNotice(message)
  }

  async function shareSelected() {
    const blob = await png(size)
    show(await presentLore(blob, filenameFor(size), postText))
  }

  async function shareOn(platform: SharePlatform) {
    const blob = await png(size)
    show(await sharePlatform(platform, blob, filenameFor(size), postText))
  }

  return (
    <section className="share-panel card-stage" aria-label="Share">
      <h2 className="share-title">Share</h2>
      <div className="share-body">
        <p className="body">Share the picture of your lore. It uses your themes only. Nothing is uploaded.</p>
        <div className="segmented" role="group" aria-label="Picture shape">
          <button type="button" className={size === 'square' ? 'btn is-on' : 'btn'} onClick={() => setSize('square')}>
            Square
          </button>
          <button type="button" className={size === 'story' ? 'btn is-on' : 'btn'} onClick={() => setSize('story')}>
            Story
          </button>
        </div>
        <div className="card-frame share-preview" ref={frameRef}>
          <div style={{ width: '100%', height: frameHeight, overflow: 'hidden' }}>
            <div style={{ width: pixels.width, height: pixels.height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <CardFace model={preview} />
            </div>
          </div>
        </div>
        <div className="export-host" aria-hidden="true">
          <CardFace model={squareModel} nodeRef={squareRef} exported />
          <CardFace model={storyModel} nodeRef={storyRef} exported />
        </div>
        <Button className="share-main" disabled={busy} onClick={() => run(shareSelected)}>
          Share my lore
        </Button>
        <h3 className="share-group">Or post it on</h3>
        <div className="share-actions">
          <Button disabled={busy} onClick={() => run(() => shareOn('x'))}>
            Post to X
          </Button>
          <Button disabled={busy} onClick={() => run(() => shareOn('instagram'))}>
            Post to Instagram
          </Button>
          <Button disabled={busy} onClick={() => run(() => shareOn('threads'))}>
            Post to Threads
          </Button>
          <Button disabled={busy} onClick={() => run(() => shareOn('linkedin'))}>
            Post to LinkedIn
          </Button>
        </div>
        <h3 className="share-group">Copy</h3>
        <div className="share-actions">
          <Button
            disabled={busy}
            onClick={() =>
              run(async () => {
                const outcome = await copyImage(await png(size), filenameFor(size))
                show(outcome)
              })
            }
          >
            Copy image
          </Button>
          <Button
            onClick={() => {
              setNotice('')
              void copyLink().then((outcome) => {
                setNotice(outcome === 'copied' ? 'Copied!' : 'Could not copy the link.')
              })
            }}
          >
            Copy link
          </Button>
        </div>
        {notice && (
          <p className="banner" role="status">
            {notice}
          </p>
        )}
        <p className="caption-preview">{postText}</p>
      </div>
    </section>
  )
}
