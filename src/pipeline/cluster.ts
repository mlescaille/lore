import { labelFromKeywords, tokenize, type Token } from './text.ts'
import { cosine } from './vector.ts'

export interface ClusterOptions {
  maxClusters?: number
  minSimilarity?: number
  floor?: number
}

interface Sparse {
  weights: Map<string, number>
  norm: number
}

interface Node<T> {
  index: number
  members: number[]
  weight: number
  vec: T
  alive: boolean
}

const TEXT_DEFAULTS = { maxClusters: 6, minSimilarity: 0.2, floor: 0.05 }
const VECTOR_DEFAULTS = { maxClusters: 6, minSimilarity: 0.45, floor: 0.22 }

function cosineSparse(a: Sparse, b: Sparse): number {
  if (a.norm === 0 || b.norm === 0) return 0
  const [small, big] = a.weights.size < b.weights.size ? [a, b] : [b, a]
  let dot = 0
  for (const [key, value] of small.weights) {
    const other = big.weights.get(key)
    if (other) dot += value * other
  }
  return dot / (a.norm * b.norm)
}

function vectorize(stems: string[], idf: Map<string, number>): Sparse {
  const weights = new Map<string, number>()
  for (const stem of new Set(stems)) {
    const weight = idf.get(stem) ?? 0
    if (weight > 0) weights.set(stem, weight)
  }
  let sum = 0
  for (const value of weights.values()) sum += value * value
  return { weights, norm: Math.sqrt(sum) }
}

function averageSparse(a: Sparse, aw: number, b: Sparse, bw: number): Sparse {
  const weights = new Map<string, number>()
  const total = aw + bw
  const keys = new Set([...a.weights.keys(), ...b.weights.keys()])
  let sum = 0
  for (const key of keys) {
    const value = ((a.weights.get(key) ?? 0) * aw + (b.weights.get(key) ?? 0) * bw) / total
    if (value !== 0) {
      weights.set(key, value)
      sum += value * value
    }
  }
  return { weights, norm: Math.sqrt(sum) }
}

function averageDense(a: number[], aw: number, b: number[], bw: number): number[] {
  const total = aw + bw
  const out = new Array<number>(a.length)
  for (let i = 0; i < a.length; i++) out[i] = ((a[i] ?? 0) * aw + (b[i] ?? 0) * bw) / total
  return out
}

function agglomerate<T>(
  vectors: T[],
  similarity: (a: T, b: T) => number,
  mergeVec: (a: T, aw: number, b: T, bw: number) => T,
  options: Required<ClusterOptions>,
): number[][] {
  const n = vectors.length
  if (n === 0) return []
  if (n === 1) return [[0]]

  const nodes: Node<T>[] = vectors.map((vec, index) => ({
    index,
    members: [index],
    weight: 1,
    vec,
    alive: true,
  }))
  const pairKey = (i: number, j: number) => (i < j ? `${i}:${j}` : `${j}:${i}`)
  const sims = new Map<string, number>()
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) sims.set(pairKey(i, j), similarity(vectors[i], vectors[j]))
  }

  const alive = () => nodes.filter((node) => node.alive)

  const recompute = (id: number) => {
    for (const other of nodes) {
      if (!other.alive || other.index === id) continue
      sims.set(pairKey(id, other.index), similarity(nodes[id].vec, other.vec))
    }
  }

  while (alive().length > 1) {
    const active = alive()
    let bestI = -1
    let bestJ = -1
    let bestScore = -Infinity
    for (let a = 0; a < active.length; a++) {
      for (let b = a + 1; b < active.length; b++) {
        const score = sims.get(pairKey(active[a].index, active[b].index)) ?? 0
        const left = Math.min(active[a].index, active[b].index)
        const right = Math.max(active[a].index, active[b].index)
        const better =
          score > bestScore + 1e-12 ||
          (Math.abs(score - bestScore) <= 1e-12 && (left < bestI || (left === bestI && right < bestJ)))
        if (better) {
          bestScore = score
          bestI = left
          bestJ = right
        }
      }
    }
    if (bestI < 0) break
    const count = active.length
    if (count <= options.maxClusters && bestScore < options.minSimilarity) break
    if (bestScore < options.floor && count <= options.maxClusters) break

    const keep = nodes[bestI]
    const drop = nodes[bestJ]
    keep.vec = mergeVec(keep.vec, keep.weight, drop.vec, drop.weight)
    keep.members.push(...drop.members)
    keep.weight += drop.weight
    drop.alive = false
    recompute(keep.index)
  }

  return alive()
    .map((node) => node.members)
    .sort((a, b) => b.length - a.length || a[0] - b[0])
}

export function keywordsFor(texts: string[], corpus: string[], limit = 4): string[] {
  const docs = corpus.map((text) => tokenize(text))
  const df = new Map<string, number>()
  const surfaces = new Map<string, Map<string, number>>()
  for (const tokens of docs) {
    const seen = new Set<string>()
    for (const token of tokens) {
      bumpSurface(surfaces, token)
      if (seen.has(token.stem)) continue
      seen.add(token.stem)
      df.set(token.stem, (df.get(token.stem) ?? 0) + 1)
    }
  }
  const n = Math.max(docs.length, 1)
  const idf = new Map<string, number>()
  for (const [stem, count] of df) idf.set(stem, Math.log((n + 1) / (count + 1)) + 1)

  const scores = new Map<string, number>()
  for (const text of texts) {
    const seen = new Set<string>()
    for (const token of tokenize(text)) {
      bumpSurface(surfaces, token)
      if (seen.has(token.stem)) continue
      seen.add(token.stem)
      scores.set(token.stem, (scores.get(token.stem) ?? 0) + (idf.get(token.stem) ?? 0))
    }
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([stem]) => favoriteSurface(surfaces, stem))
}

function bumpSurface(surfaces: Map<string, Map<string, number>>, token: Token) {
  const bag = surfaces.get(token.stem) ?? new Map<string, number>()
  bag.set(token.surface, (bag.get(token.surface) ?? 0) + 1)
  surfaces.set(token.stem, bag)
}

function favoriteSurface(surfaces: Map<string, Map<string, number>>, stem: string): string {
  const bag = surfaces.get(stem)
  if (!bag) return stem
  let best = stem
  let bestN = -1
  for (const [surface, count] of bag) {
    if (count > bestN || (count === bestN && surface < best)) {
      best = surface
      bestN = count
    }
  }
  return best
}

export function clusterByText(items: { id: string; text: string }[], options: ClusterOptions = {}): string[][] {
  if (items.length === 0) return []
  const docs = items.map((item) => tokenize(item.text).map((token) => token.stem))
  const df = new Map<string, number>()
  for (const doc of docs) {
    for (const stem of new Set(doc)) df.set(stem, (df.get(stem) ?? 0) + 1)
  }
  const n = docs.length
  const idf = new Map<string, number>()
  for (const [stem, count] of df) idf.set(stem, Math.log((n + 1) / (count + 1)) + 1)
  const vectors = docs.map((doc) => vectorize(doc, idf))
  const groups = agglomerate(vectors, cosineSparse, averageSparse, { ...TEXT_DEFAULTS, ...options })
  return groups.map((indexes) => indexes.map((index) => items[index].id))
}

export function clusterByVectors(ids: string[], vectors: number[][], options: ClusterOptions = {}): string[][] {
  if (ids.length !== vectors.length) throw new Error('Embedding count does not match the records.')
  const groups = agglomerate(vectors, cosine, averageDense, { ...VECTOR_DEFAULTS, ...options })
  return groups.map((indexes) => indexes.map((index) => ids[index]))
}

export function uniqueLabel(keywords: string[], used: Set<string>): string {
  const base = labelFromKeywords(keywords)
  if (!used.has(base)) {
    used.add(base)
    return base
  }
  for (const keyword of keywords) {
    const next = `${base} · ${labelFromKeywords([keyword])}`
    if (!used.has(next)) {
      used.add(next)
      return next
    }
  }
  const fallback = `${base} · ${used.size + 1}`
  used.add(fallback)
  return fallback
}
