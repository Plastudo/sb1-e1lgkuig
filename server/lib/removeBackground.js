import { removeBackground as imglyRemoveBg } from '@imgly/background-removal-node'

let modelWarned = false

/**
 * Removes the background from an image buffer using @imgly/background-removal-node.
 * On first call, ONNX models (~45 MB) are downloaded and cached automatically.
 *
 * @param {Buffer} imageBuffer
 * @returns {Promise<Buffer>} PNG with transparent background
 */
export async function removeBackground(imageBuffer) {
  if (!modelWarned) {
    console.log('[bg-removal] First call — models may download (~45 MB, cached after).')
    modelWarned = true
  }

  const blob   = new Blob([imageBuffer], { type: 'image/png' })
  const result = await imglyRemoveBg(blob, {
    model: 'medium',
    output: { format: 'image/png', quality: 1 },
  })

  const buf = await result.arrayBuffer()
  return Buffer.from(buf)
}
