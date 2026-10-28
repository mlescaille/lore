import type { Ref } from 'react'
import { cardPixels, shareCardSvg, type ShareCardModel } from '../share/card.ts'

export function CardFace({
  model,
  nodeRef,
  exported = false,
}: {
  model: ShareCardModel
  nodeRef?: Ref<HTMLDivElement>
  exported?: boolean
}) {
  const { width, height } = cardPixels(model.size)
  return (
    <div
      ref={nodeRef}
      data-share-export={exported ? model.size : undefined}
      data-share-width={exported ? width : undefined}
      data-share-height={exported ? height : undefined}
      style={{ width, height, lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: shareCardSvg(model) }}
    />
  )
}
