import sharp from 'sharp'

const MIN_DIMENSION = 200  // px
const MIN_BRIGHTNESS = 30  // too dark
const MAX_BRIGHTNESS = 245 // overexposed

/**
 * Basic image quality checks.
 * @returns {{ valid: boolean, error?: string }}
 */
export async function validateImage(imageBuffer) {
  const [meta, stats] = await Promise.all([
    sharp(imageBuffer).metadata(),
    sharp(imageBuffer).stats(),
  ])

  if (meta.width < MIN_DIMENSION || meta.height < MIN_DIMENSION) {
    return {
      valid: false,
      error: `Imagem demasiado pequena (${meta.width}×${meta.height}px). Usa uma foto com pelo menos 200×200 px.`,
    }
  }

  const brightness = (
    stats.channels[0].mean +
    stats.channels[1].mean +
    stats.channels[2].mean
  ) / 3

  if (brightness < MIN_BRIGHTNESS) {
    return { valid: false, error: 'Imagem demasiado escura. Usa uma foto com melhor iluminação.' }
  }
  if (brightness > MAX_BRIGHTNESS) {
    return { valid: false, error: 'Imagem demasiado clara ou sobreexposta.' }
  }

  return { valid: true }
}
