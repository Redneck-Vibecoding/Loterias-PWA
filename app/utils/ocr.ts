// Client-side OCR helper for lottery tickets. Runs entirely in the browser with
// tesseract.js so ticket photos never leave the user's device.

const OCR_LANGS = 'spa+eng'

// Recognise the combined text of one or more images, reusing a single worker.
export async function recognizeImages(
  images: (string | Blob)[],
  onProgress?: (progress: number) => void
): Promise<string> {
  if (images.length === 0) return ''
  const { createWorker } = await import('tesseract.js')
  let pageIndex = 0
  const worker = await createWorker(OCR_LANGS, 1, {
    logger: onProgress
      ? (m: { status: string, progress: number }) => {
          if (m.status === 'recognizing text') {
            onProgress((pageIndex + m.progress) / images.length)
          }
        }
      : undefined
  })
  try {
    const texts: string[] = []
    for (let i = 0; i < images.length; i++) {
      pageIndex = i
      const { data } = await worker.recognize(images[i]!)
      texts.push(data.text || '')
    }
    return texts.join('\n')
  } finally {
    await worker.terminate()
  }
}

export async function recognizeText(
  image: string | Blob,
  onProgress?: (progress: number) => void
): Promise<string> {
  return recognizeImages([image], onProgress)
}
