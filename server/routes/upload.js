import express from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { validateImage } from '../lib/validateImage.js'
import { cropToPortrait } from '../lib/cropImage.js'
import { removeBackground } from '../lib/removeBackground.js'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Apenas imagens JPG, PNG ou WebP são aceites.'))
    }
    cb(null, true)
  },
})

router.post('/process-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem recebida.' })
    }

    // Face bounding box detected and validated by the frontend
    let faceBox
    try {
      faceBox = JSON.parse(req.body.faceBox)
      if (!Number.isFinite(faceBox.x) || !Number.isFinite(faceBox.y) ||
          !Number.isFinite(faceBox.width) || !Number.isFinite(faceBox.height)) {
        throw new Error('invalid fields')
      }
    } catch {
      return res.status(400).json({ error: 'Bounding box da face inválido.' })
    }

    const imageBuffer = req.file.buffer
    const meta = await sharp(imageBuffer).metadata()

    // 1. Quality validation (brightness, dimensions)
    const validation = await validateImage(imageBuffer)
    if (!validation.valid) {
      return res.status(422).json({ error: validation.error })
    }

    // 2. Crop to portrait (face + shoulders)
    const cropped = await cropToPortrait(
      imageBuffer,
      faceBox,
      meta.width,
      meta.height,
    )

    // 3. Remove background
    const noBg = await removeBackground(cropped)

    // 4. Resize to 512×512, transparent padding, optimise PNG
    const final = await sharp(noBg)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 8 })
      .toBuffer()

    res.set('Content-Type', 'image/png')
    res.send(final)

  } catch (err) {
    console.error('[process-photo]', err)
    res.status(500).json({ error: 'Erro interno ao processar a imagem. Tenta novamente.' })
  }
})

export default router
