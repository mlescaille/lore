import { labelFromKeywords } from '../pipeline/text.ts'
import type { LabelingMode } from '../types.ts'

export interface ClusterDraft {
  keywords: string[]
  /** Excerpts that already passed the exclusion pass. Never send raw screenshots. */
  excerpts: string[]
}

/**
 * v1 names themes from keywords on the device.
 * A later version can send keywords and excluded-passed text to a model
 * with a key that stays in the browser. Do not send text that failed exclusion.
 */
export interface ThemeLabeler {
  mode: LabelingMode
  labelCluster(input: ClusterDraft): Promise<string>
}

export function keywordLabeler(): ThemeLabeler {
  return {
    mode: 'keywords',
    labelCluster(input) {
      return Promise.resolve(labelFromKeywords(input.keywords))
    },
  }
}

export function modelLabeler(_apiKey: string): ThemeLabeler {
  return {
    mode: 'model',
    labelCluster() {
      return Promise.reject(
        new Error(
          'Model labeling is not in v1. A later version would keep the key in the browser and send only keywords plus text that passed exclusion.',
        ),
      )
    },
  }
}
