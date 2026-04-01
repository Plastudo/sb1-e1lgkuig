/**
 * Downloads face-api.js TinyFaceDetector model files into public/models/.
 * Run once: node server/scripts/downloadModels.js
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODELS_DIR = path.join(__dirname, '../../public/models')
const BASE = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'

const FILES = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
]

async function download(filename) {
  const dest = path.join(MODELS_DIR, filename)
  if (fs.existsSync(dest)) {
    console.log(`  ✓  ${filename} (já existe)`)
    return
  }
  process.stdout.write(`  ↓  ${filename} ...`)
  const res = await fetch(`${BASE}/${filename}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} ao descarregar ${filename}`)
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
  console.log(' ok')
}

fs.mkdirSync(MODELS_DIR, { recursive: true })
console.log('A descarregar modelos face-api.js para public/models/ ...')
for (const f of FILES) await download(f)
console.log('\nPronto! Modelos em public/models/')
