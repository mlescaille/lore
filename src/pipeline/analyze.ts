import { keywordLabeler } from '../seams/labeling.ts'
import type { Grouping, InputShot, LoreResult, ShotRecord, Theme } from '../types.ts'
import { describeChapters, writeBiography } from './biography.ts'
import { splitChapters } from './chapters.ts'
import { clusterByText, clusterByVectors, keywordsFor, uniqueLabel } from './cluster.ts'
import { excludeRecords } from './exclusion.ts'
import { isImageOnly } from './text.ts'

export interface AnalyzeOptions {
  blocklist?: string[]
  runDate?: string
  /** Embed only text that already survived exclusion. Throw to fall back to words. */
  embed?: (texts: string[]) => Promise<number[][]>
}

/**
 * Exclusion runs before themes, chapters, and the biography.
 * Records that fail the check are not returned — only counts.
 */
export async function analyzeShots(shots: InputShot[], options: AnalyzeOptions = {}): Promise<LoreResult> {
  const exclusion = excludeRecords(shots, options.blocklist ?? [])
  const imageOnly = exclusion.kept.filter((shot) => isImageOnly(shot.text))
  const wordy = exclusion.kept.filter((shot) => !isImageOnly(shot.text))
  const labeler = keywordLabeler()

  let grouping: Grouping = 'lexical'
  let idGroups: string[][] = []
  if (wordy.length > 0 && options.embed) {
    try {
      const vectors = await options.embed(wordy.map((shot) => shot.text.slice(0, 800)))
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

  const records: ShotRecord[] = exclusion.kept
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
      labelingMode: labeler.mode,
      grouping,
      totalCount: shots.length,
      excludedCount: exclusion.excludedCount,
      exclusion: exclusion.byReason,
      imageOnlyCount: imageOnly.length,
      lowConfidenceTimestamps: records.filter((record) => record.timestampSource === 'lastModified').length,
    },
    themes,
    records,
    chapters,
    biography,
  }
}
