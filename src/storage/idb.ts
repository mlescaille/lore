import type { ScoreResult } from '../pipeline/scoring.ts'
import type { LoreResult } from '../types.ts'

export interface SavedReading {
  version: 1
  savedAt: string
  kind: 'sample' | 'own'
  result: LoreResult
  guesses: string[]
  score: ScoreResult | null
}

const DB_NAME = 'lore'
const STORE = 'readings'
const KEY = 'latest'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open storage'))
  })
}

export async function loadSaved(): Promise<SavedReading | null> {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY)
      request.onsuccess = () => {
        const value = request.result as SavedReading | undefined
        resolve(value?.version === 1 ? value : null)
      }
      request.onerror = () => reject(request.error ?? new Error('Could not read storage'))
    })
  } finally {
    db.close()
  }
}

export async function saveReading(reading: SavedReading): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(reading, KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('Could not save'))
    })
  } finally {
    db.close()
  }
}

export function forgetAll(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Could not forget'))
    request.onblocked = () => resolve()
  })
}
