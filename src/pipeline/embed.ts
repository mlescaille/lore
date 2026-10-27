type Extractor = (
  text: string,
  options: { pooling: 'mean'; normalize: boolean },
) => Promise<{ data: ArrayLike<number> }>

let extractorPromise: Promise<Extractor> | null = null

/** Small sentence model. Downloaded once to the device. Never receives excluded text. */
export async function embedTexts(
  texts: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<number[][]> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers')
      env.allowLocalModels = false
      const extractor = await pipeline('feature-extraction', 'onnx-community/all-MiniLM-L6-v2-ONNX', {
        dtype: 'q8',
      })
      return extractor as unknown as Extractor
    })()
  }

  let extractor: Extractor
  try {
    extractor = await extractorPromise
  } catch (error) {
    extractorPromise = null
    throw error
  }

  const vectors: number[][] = []
  for (let index = 0; index < texts.length; index++) {
    const result = await extractor((texts[index] ?? '').slice(0, 800), { pooling: 'mean', normalize: true })
    vectors.push(Array.from(result.data))
    onProgress?.(index + 1, texts.length)
    if (index % 3 === 2) await new Promise((resolve) => setTimeout(resolve, 0))
  }
  return vectors
}
