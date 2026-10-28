import { useEffect, useRef, useState } from 'react'
import { suggestionFor } from '../pipeline/biography.ts'
import { topThemes } from '../pipeline/scoring.ts'
import { buildCaption, cardToBlob, downloadBlob, shareCard } from '../share/export.ts'
import { formatRange } from '../lib/format.ts'
import type { LoreResult } from '../types.ts'
import { CardFace, type CardModel } from './CardFace.tsx'
import { Button } from './ui/button.tsx'

function modelFor(result: LoreResult, size: 'square' | 'story'): CardModel {
  const top = topThemes(result.themes)
  const start = result.records[0]?.timestamp ?? result.chapters[0]?.start
  const end = result.records[result.records.length - 1]?.timestamp ?? result.chapters[result.chapters.length - 1]?.end
  return {
    epithet: result.biography.epithet,
    rangeLabel: start && end ? formatRange(start, end) : 'This reading',
    total: result.records.length,
    themes: top.map((theme) => ({
      label: theme.label,
      count: theme.count,
      line: suggestionFor(theme.id, theme.label),
    })),
    size,
  }
}

export function BiographyStage({ result }: { result: LoreResult }) {
  const [size, setSize] = useState<'square' | 'story'>('square')
  const [width, setWidth] = useState(640)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [canShare, setCanShare] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const model = modelFor(result, size)
  const scale = Math.min(1, width / 1080)
  const height = (size === 'story' ? 1920 : 1080) * scale
  const caption = buildCaption(result.biography.epithet)
  const filename = size === 'story' ? 'lore-story.png' : 'lore-square.png'

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && 'share' in navigator)
  }, [])

  useEffect(() => {
    const node = frameRef.current
    if (!node) return
    const observer = new ResizeObserver(() => setWidth(node.clientWidth))
    observer.observe(node)
    setWidth(node.clientWidth)
    return () => observer.disconnect()
  }, [])

  async function png() {
    const node = exportRef.current
    if (!node) throw new Error('Card is not ready')
    return cardToBlob(node)
  }

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setNotice('')
    try {
      await action()
    } catch {
      setNotice('Could not build the image. You can still copy the caption.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card-stage">
        <h2 className="pane-title">Share it</h2>
        <p className="body">Download a picture of your lore. It does not include your screenshots.</p>
        <div className="segmented" role="group" aria-label="Picture shape">
          <button type="button" className={size === 'square' ? 'is-on' : ''} onClick={() => setSize('square')}>
            Square
          </button>
          <button type="button" className={size === 'story' ? 'is-on' : ''} onClick={() => setSize('story')}>
            Story
          </button>
        </div>
        <div className="card-frame" ref={frameRef} style={{ height }}>
          <div style={{ width: 1080, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <CardFace model={model} />
          </div>
        </div>
        <div className="export-host" aria-hidden="true">
          <CardFace model={model} nodeRef={exportRef} />
        </div>
        <div className="actions">
          <Button size="lg" disabled={busy} onClick={() => run(async () => downloadBlob(await png(), filename))}>
            {busy ? 'Making the image…' : 'Download PNG'}
          </Button>
          {canShare && (
            <Button
              size="lg"
              variant="paper"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const outcome = await shareCard(await png(), filename, caption)
                  if (outcome === 'downloaded') setNotice('This browser saved the image instead of sharing it.')
                })
              }
            >
              Share
            </Button>
          )}
          <Button
            size="lg"
            variant="quiet"
            onClick={() => {
              void navigator.clipboard.writeText(caption).then(
                () => setNotice('Caption copied.'),
                () => setNotice(caption),
              )
            }}
          >
            Copy caption
          </Button>
        </div>
        {notice && <p className="note">{notice}</p>}
        <p className="caption-preview">{caption}</p>
    </section>
  )
}
