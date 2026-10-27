export type ExclusionReason = 'account' | 'medical' | 'blocklist'

export interface ExclusionCounts {
  account: number
  medical: number
  blocklist: number
}

export interface ExclusionResult<T> {
  kept: T[]
  excludedCount: number
  byReason: ExclusionCounts
}

const MEDICAL = [
  'metformin',
  'atorvastatin',
  'lisinopril',
  'amlodipine',
  'sertraline',
  'fluoxetine',
  'escitalopram',
  'bupropion',
  'adderall',
  'ritalin',
  'oxycodone',
  'hydrocodone',
  'alprazolam',
  'xanax',
  'zoloft',
  'lexapro',
  'wegovy',
  'ozempic',
  'insulin',
  'mychart',
  'patient portal',
  'explanation of benefits',
  'hemoglobin',
  'biopsy',
  'radiology',
  'mammogram',
  'colonoscopy',
  'diagnosis',
  'diagnosed',
  'prescription',
  'dosage',
  'icd-10',
  'a1c',
  'hba1c',
  'medical record',
  'lab results',
  'blood test',
  'ssri',
  'mri',
]

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hasPhrase(text: string, phrase: string): boolean {
  const pattern = new RegExp(`(?<![a-z0-9])${escapeRegExp(phrase)}(?![a-z0-9])`, 'i')
  return pattern.test(text)
}

export function luhnOk(digits: string): boolean {
  if (!/^\d{13,19}$/.test(digits)) return false
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

export function abaValid(digits: string): boolean {
  if (!/^\d{9}$/.test(digits)) return false
  const d = digits.split('').map(Number)
  const sum = 3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])
  return sum !== 0 && sum % 10 === 0
}

function looksLikeTimestamp(digits: string): boolean {
  if (digits.length !== 14) return false
  const year = Number(digits.slice(0, 4))
  const month = Number(digits.slice(4, 6))
  const day = Number(digits.slice(6, 8))
  const hour = Number(digits.slice(8, 10))
  const minute = Number(digits.slice(10, 12))
  const second = Number(digits.slice(12, 14))
  return year >= 1990 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31 && hour <= 23 && minute <= 59 && second <= 59
}

export function hasCardNumber(text: string): boolean {
  const pattern = /(?<!\d)(?:\d[ -]?){13,19}(?!\d)/g
  for (const match of text.slice(0, 20000).matchAll(pattern)) {
    const digits = match[0].replace(/\D/g, '')
    if (digits.length < 13 || digits.length > 19) continue
    if (/^(\d)\1+$/.test(digits)) continue
    if (looksLikeTimestamp(digits)) continue
    if (luhnOk(digits)) return true
  }
  return false
}

function hasRoutingNumber(text: string): boolean {
  return /(?:routing|rtn|aba)\s*(?:number|no\.?|#)?\s*[:#-]?\s*\d{9}\b/i.test(text)
}

function hasLabeledAccount(text: string): boolean {
  return /\b(?:account|acct|card|iban|routing)\b(?:\s*(?:number|no\.?|#))?\s*[:#-]?\s*\d[\d -]{5,24}\d/i.test(text)
}

function hasIban(text: string): boolean {
  const pattern = /(?:^|[^A-Z0-9])([A-Z]{2}\d{2}(?:[ -]?[A-Z0-9]){11,30})/gi
  for (const match of text.matchAll(pattern)) {
    const compact = (match[1] ?? '').replace(/[ -]/g, '')
    if (compact.length >= 15 && compact.length <= 34) return true
  }
  return false
}

function hasSsn(text: string): boolean {
  return /\b\d{3}-\d{2}-\d{4}\b/.test(text)
}

export function hasAccountSignal(text: string): boolean {
  return hasCardNumber(text) || hasRoutingNumber(text) || hasLabeledAccount(text) || hasIban(text) || hasSsn(text)
}

export function hasMedicalTerm(text: string): boolean {
  return MEDICAL.some((term) => hasPhrase(text, term))
}

export function parseBlocklist(raw: string): string[] {
  const seen = new Set<string>()
  for (const part of raw.split(/[,\n]/)) {
    const word = part.trim().toLowerCase()
    if (word.length < 3) continue
    seen.add(word)
  }
  return [...seen]
}

export function blocklistHit(text: string, blocklist: string[]): boolean {
  return blocklist.some((word) => hasPhrase(text, word))
}

export function exclusionReasons(text: string, blocklist: string[]): ExclusionReason[] {
  const reasons: ExclusionReason[] = []
  if (hasAccountSignal(text)) reasons.push('account')
  if (hasMedicalTerm(text)) reasons.push('medical')
  if (blocklistHit(text, blocklist)) reasons.push('blocklist')
  return reasons
}

/**
 * Drop sensitive records completely. Callers keep the counts and nothing else.
 * This runs before embedding, labeling, chaptering, and display.
 */
export function excludeRecords<T extends { id: string; text: string }>(
  records: T[],
  blocklist: string[] = [],
): ExclusionResult<T> {
  const kept: T[] = []
  const byReason: ExclusionCounts = { account: 0, medical: 0, blocklist: 0 }
  for (const record of records) {
    const reasons = exclusionReasons(record.text, blocklist)
    if (reasons.length === 0) {
      kept.push(record)
      continue
    }
    for (const reason of reasons) byReason[reason] += 1
  }
  return {
    kept,
    excludedCount: records.length - kept.length,
    byReason,
  }
}
