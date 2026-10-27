import { keywordLabeler } from '../seams/labeling.ts'
import type { Grouping, InputShot, LoreResult, ShotRecord, Theme } from '../types.ts'
import { describeChapters, writeBiography } from './biography.ts'
import { splitChapters } from './chapters.ts'
import { clusterByText, clusterByVectors, keywordsFor, uniqueLabel } from './cluster.ts'
import { excludeRecords } from './exclusion.ts'
import type { VisualHit } from './signals.ts'
import { themesFromSignals } from './themes.ts'
import { isImageOnly } from './text.ts'

export interface AnalyzeOptions {
  blocklist?: string[]
  runDate?: string
  /** Embed only text that already survived exclusion. Throw to fall back to words. */
  embed?: (texts: string[]) => Promise<number[][]>
  /**
   * Vision scores for kept ids only. Called after exclusion.
   * Throw or return an empty map to name themes from cleaned text alone.
   */
  perceive?: (ids: string[]) => Promise<Map<string, VisualHit[]>>
}

function separate(shots: InputShot[], blocklist: string[]) {
  const exclusion = excludeRecords(
    shots.map((shot) => ({ ...shot, text: shot.sensitiveText ?? shot.text })),
    blocklist,
  )
  const byId = new Map(shots.map((shot) => [shot.id, shot]))
  const kept: InputShot[] = []
  for (const shot of exclusion.kept) {
    const original = byId.get(shot.id)
    if (original) kept.push(original)
  }
  return { exclusion, kept }
}

function assemble(
  shots: InputShot[],
  kept: InputShot[],
  themes: Theme[],
  themeOf: Map<string, string>,
  grouping: Grouping,
  exclusion: ReturnType<typeof separate>['exclusion'],
  options: AnalyzeOptions,
): LoreResult {
  const records: ShotRecord[] = kept
    .map((shot) => ({
      id: shot.id,
      timestamp: shot.timestamp,
      timestampSource: shot.timestampSource,
      themeId: themeOf.get(shot.id) ?? 'vibes',
      text: shot.text,
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.id.localeCompare(b.id))

  const chapters = describeChapters(splitChapters(records), themes, records)
  const biography = writeBiography(themes, chapters, records.length)

  return {
    meta: {
      runDate: options.runDate ?? new Date().toISOString(),
      labelingMode: keywordLabeler().mode,
      grouping,
      totalCount: shots.length,
      excludedCount: exclusion.excludedCount,
      exclusion: exclusion.byReason,
      imageOnlyCount: kept.filter((shot) => isImageOnly(shot.text)).length,
      lowConfidenceTimestamps: records.filter((record) => record.timestampSource === 'lastModified').length,
    },
    themes,
    records,
    chapters,
    biography,
  }
}

async function themesFromWords(wordy: InputShot[], embed: AnalyzeOptions['embed']) {
  const labeler = keywordLabeler()
  let grouping: Grouping = 'lexical'
  let idGroups: string[][] = []
  if (wordy.length > 0 && embed) {
    try {
      const vectors = await embed(wordy.map((shot) => shot.text.slice(0, 800)))
      if (vectors.length === wordy.length) {
        idGroups = clusterByVectors(
          wordy.map((shot) => shot.id),
          vectors,
        )
        grouping = 'embeddings'
      }
    } catch {
      grouping = 'lexical'
    }
  }
  if (wordy.length > 0 && grouping === 'lexical') {
    idGroups = clusterByText(wordy.map((shot) => ({ id: shot.id, text: shot.text })))
  }

  const corpus = wordy.map((shot) => shot.text)
  const byShot = new Map(wordy.map((shot) => [shot.id, shot]))
  const used = new Set<string>()
  const themes: Theme[] = []
  const themeOf = new Map<string, string>()

  for (const [index, ids] of idGroups.entries()) {
    const texts = ids.map((id) => byShot.get(id)?.text ?? '')
    const keywords = keywordsFor(texts, corpus)
    const proposed = await labeler.labelCluster({
      keywords,
      excerpts: texts.map((text) => text.slice(0, 280)),
    })
    const label = uniqueLabel(keywords.length > 0 ? keywords : [proposed], used)
    const id = `t${index + 1}`
    themes.push({ id, label, keywords, count: ids.length })
    for (const shotId of ids) themeOf.set(shotId, id)
  }
  return { themes, themeOf, grouping }
}

/**
 * Exclusion runs before themes, chapters, and the biography.
 * Records that fail the check are not returned — only counts.
 * Own pictures are named from a fixed set of human labels, never raw OCR tokens.
 */
export async function analyzeShots(shots: InputShot[], options: AnalyzeOptions = {}): Promise<LoreResult> {
  const { exclusion, kept } = separate(shots, options.blocklist ?? [])

  if (options.perceive) {
    let visual = new Map<string, VisualHit[]>()
    let usedVision = false
    try {
      visual = await options.perceive(kept.map((shot) => shot.id))
      usedVision = [...visual.values()].some((hits) => hits.length > 0)
    } catch {
      visual = new Map()
    }
    const assigned = themesFromSignals(kept, visual, usedVision)
    return assemble(shots, kept, assigned.themes, assigned.themeOf, assigned.grouping, exclusion, options)
  }

  const imageOnly = kept.filter((shot) => isImageOnly(shot.text))
  const wordy = kept.filter((shot) => !isImageOnly(shot.text))
  const assigned = await themesFromWords(wordy, options.embed)
  const themes = [...assigned.themes]
  const themeOf = assigned.themeOf
  if (imageOnly.length > 0) {
    themes.push({
      id: 'vibes',
      label: 'no words, just vibes',
      keywords: [],
      count: imageOnly.length,
    })
    for (const shot of imageOnly) themeOf.set(shot.id, 'vibes')
  }
  themes.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
  return assemble(shots, kept, themes, themeOf, assigned.grouping, exclusion, options)
}
