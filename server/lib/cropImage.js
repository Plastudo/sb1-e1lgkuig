import sharp from 'sharp'

/**
 * Crops an image to portrait framing (face + shoulders).
 * The face is placed in the upper-centre of the crop.
 *
 * Expansion ratios (relative to face bounding box):
 *   width  ×2.4 → includes shoulders
 *   height ×3.2 → includes top-of-head + chin + chest
 */
export async function cropToPortrait(imageBuffer, faceBox, imageWidth, imageHeight) {
  const { x, y, width, height } = faceBox

  const cropW = Math.round(width  * 2.4)
  const cropH = Math.round(height * 3.2)

  // Horizontal centre on face centre
  const faceCenterX = x + width / 2
  // Vertical: face top sits at ~18% from the crop top
  const headroom = Math.round(cropH * 0.18)

  let left = Math.round(faceCenterX - cropW / 2)
  let top  = Math.round(y - headroom)

  // Clamp to image bounds
  left = Math.max(0, Math.min(left, imageWidth  - cropW))
  top  = Math.max(0, Math.min(top,  imageHeight - cropH))

  const extractW = Math.min(cropW, imageWidth  - left)
  const extractH = Math.min(cropH, imageHeight - top)

  return sharp(imageBuffer)
    .extract({ left, top, width: extractW, height: extractH })
    .toBuffer()
}
