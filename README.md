# Lore

Discover your lore. Lore treats a set of screenshots as a diary you didn’t agree to write: you guess the top three themes, then the app shows the patterns, scores the guess by meaning, and ends on a playful biography card.

Everything that touches your pictures runs in the browser. There is no backend and no account.

## Privacy model

Nothing is uploaded. The page never sends screenshot bytes, OCR text, or guesses to a server.

What does leave the device, and only if you ask:

- The first time you read **your own** screenshots, the text reader downloads an English language file from a CDN (jsDelivr, tesseract.js). After that it stays in the browser cache.
- The first time you read your own pictures, a small vision model downloads once from Hugging Face (`Xenova/mobileclip_s0`, about 90 MB) and runs locally. A progress bar on the installer shows the download. It is how Lore can name a photo that has little or no text. If it cannot load, themes fall back to cleaned words. The sample set never downloads it.
- If the small meaning model can load, it downloads once from Hugging Face (`onnx-community/all-MiniLM-L6-v2-ONNX`) and runs locally, only to score your guess against the theme names. If it cannot, the guess is scored by word overlap instead.
- Sharing opens X or LinkedIn with a caption made only of the epithet and a link. The card image is a download, not an upload. The caption never includes screenshot text.

What stays, and how it is thrown away:

1. Files are read locally. Duplicates drop out by a hash of the bytes.
2. Text is read on device (your files) or taken from the sample manifest (the sample set).
3. **Exclusion runs before themes, chapters, or display.** Account, card, routing, and IBAN-like numbers, a built-in medical word list, and any words you type under “Leave words out” remove the whole record. Only counts remain. The check sees the raw read; themes never do.
4. Low-confidence OCR, fragments, and tokens like `150k` are dropped before any theme is named. Theme names are human labels (Celebrations, Systems notes), not leftover tokens.
5. The biography card uses theme names, counts, and dates. Never the words from a screenshot.
6. `data.json` is an explicit download of the reading, including OCR text. The card is not.
7. “Keep this reading on this device” writes the reading (not the image files) to IndexedDB. It is off until you turn it on.
8. **Forget** deletes that database, drops the in-memory reading, and revokes image URLs. Your original files are untouched.

Dates come from the photo’s EXIF time, then from iOS, macOS, and Android filename patterns, then from the file’s last-modified time. That last source is marked low confidence (a hollow dot). Whether iOS keeps EXIF when you pick from Photos is still something to check on a real phone — the picker has been known to strip it, which makes every date look like “today.”

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4317/lore/](http://127.0.0.1:4317/lore/). The app is built to live under `/lore`.

The interface is one original retro installer: pixel chrome for windows and buttons, Atkinson Hyperlegible for anything you read or type, beveled panels, and a trading-card biography. There is no theme switch.

```bash
npm test          # exclusion, timestamps, chaptering, scoring, sample coherence
npm run build     # tsc + static files in dist/
npm run preview   # serve dist/ on the same port
```

## Replace the sample set

The fictional roll is Jules Navarro (Portland, March 2025–February 2026): recipes, a Lisbon trip, a group chat, running, and studio work, plus two sensitive shots that the pipeline must drop.

1. Edit `src/sample/manifest.ts`. Each entry is a date, a template (`notes`, `messages`, `safari`, `slack`, `run`, `map`, `calendar`, `photo`, `clinic`, `wallet`), and the lines that should be readable in the picture. `themeHint` is only for drawing and tests. The pipeline never sees it.
2. Render the pictures:

```bash
npm run sample:render
```

That writes `public/sample/<id>.png`. “Load sample” then runs the real theme, chapter, score, and biography pipeline on those lines. It skips optical character recognition so the demo stays under a minute. Your own files still go through OCR.

`src/pipeline/sample.test.ts` checks that the sample stays coherent (exclusion counts, theme purity, the epithet, no screenshot text in the card copy). Update that test if you change the persona on purpose.

## Deploy under `/lore`

`vite.config.ts` sets `base: '/lore/'`. `npm run build` emits a static `dist/` whose asset URLs already include that prefix.

On an Astro site on Vercel, copy `dist/` into the site’s `public/lore/` directory (so `index.html` is served at `/lore/` and `/lore/assets/…` resolves), or rewrite `/lore` and `/lore/*` to this build. Do not strip the base path.

`APP_URL` in `src/config.ts` is `https://mlescaille.com/lore`, the link inside the share caption. `ESSAY_URL`, the footer link “the idea behind Lore”, is still a placeholder.

## Not in v1

Left as seams, not built:

- Biography book (paged reader / PDF): `src/seams/book.ts` turns a reading into cover, foreword, chapters, turning points, and epilogue. Quote ids are already stored on chapters.
- Google Drive export: `src/seams/drive.ts`. When it exists it should use `drive.file` scope, only for files Lore creates.
- Model labeling with the visitor’s own API key: `src/seams/labeling.ts`. v1 names clusters from keywords. A future labeler must see only text that already passed exclusion.
