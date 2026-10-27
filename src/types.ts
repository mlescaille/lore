export type TimestampSource = 'exif' | 'filename' | 'lastModified'
export type LabelingMode = 'keywords' | 'model'
export type Grouping = 'embeddings' | 'lexical' | 'vision'

export interface ExclusionCounts {
  account: number
  medical: number
  blocklist: number
}

export interface LoreMeta {
  runDate: string
  labelingMode: LabelingMode
  grouping: Grouping
  totalCount: number
  excludedCount: number
  exclusion: ExclusionCounts
  imageOnlyCount: number
  lowConfidenceTimestamps: number
}

export interface Theme {
  id: string
  label: string
  keywords: string[]
  count: number
}

export interface ShotRecord {
  id: string
  timestamp: string
  timestampSource: TimestampSource
  themeId: string
  text: string
}

export interface Chapter {
  id: string
  start: string
  end: string
  themeId: string
  title: string
  narrative: string
  quoteIds: string[]
}

export interface TurningPoint {
  date: string
  fromThemeId: string
  toThemeId: string
  line: string
}

export interface Biography {
  epithet: string
  closingLine: string
  turningPoints: TurningPoint[]
  epilogue: string
}

/** In-memory result and the shape of data.json. */
export interface LoreResult {
  meta: LoreMeta
  themes: Theme[]
  records: ShotRecord[]
  chapters: Chapter[]
  biography: Biography
}

export interface InputShot {
  id: string
  timestamp: string
  timestampSource: TimestampSource
  /** Cleaned text used for themes and stored on the record. */
  text: string
  /** Unfiltered OCR. Exclusion only. Never stored or shown. */
  sensitiveText?: string
}
