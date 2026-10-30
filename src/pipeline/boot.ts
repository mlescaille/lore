/** Start the model downloads as soon as the page loads. The second visit uses the browser cache. */
export function bootModels(): void {
  void import('./vision.ts')
    .then(({ preloadVision }) => preloadVision())
    .catch((error) => console.error('Lore failed during model', error))
  void import('./ocr.ts')
    .then(({ preloadOcr }) => preloadOcr())
    .catch((error) => console.error('Lore failed during words', error))
  void import('./embed.ts')
    .then(({ preloadEmbed }) => preloadEmbed())
    .catch((error) => console.error('Lore failed during model', error))
}
