import React, { useCallback, useEffect, useRef, useState } from 'react'
import * as faceapi from '@vladmandic/face-api'

/* ── Config ─────────────────────────────────────────────────────────────── */
const MODELS_URL        = '/models'
const SERVER_URL        = import.meta.env.VITE_IMAGE_SERVER_URL ?? 'http://localhost:3001'
const MIN_FACE_RATIO    = 0.05   // face must be ≥ 5% of image area
const MAX_FILE_SIZE     = 10 * 1024 * 1024 // 10 MB

/* ── Types ──────────────────────────────────────────────────────────────── */
type Stage =
  | 'loading-models'
  | 'ready'
  | 'detecting'
  | 'preview'
  | 'uploading'
  | 'done'
  | 'model-error'

interface FaceBox { x: number; y: number; width: number; height: number }

interface Props {
  /** Called with a base64 data-URL of the processed image */
  onProcessed: (base64: string) => void
  /** Current profile picture (shown in "done" state) */
  currentImage?: string
}

/* ── Component ──────────────────────────────────────────────────────────── */
export const ProfilePictureUpload: React.FC<Props> = ({ onProcessed, currentImage }) => {
  const [stage,   setStage]   = useState<Stage>('loading-models')
  const [error,   setError]   = useState<string | null>(null)
  const [faceBox, setFaceBox] = useState<FaceBox | null>(null)
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null)
  const [result,  setResult]  = useState<string | null>(currentImage ?? null)

  const [pendingDraw, setPendingDraw] = useState<{ img: HTMLImageElement; box: FaceBox } | null>(null)

  const fileRef    = useRef<HTMLInputElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const pendingFile = useRef<File | null>(null)

  /* ── Load face-api models ────────────────────────────────────────────── */
  useEffect(() => {
    faceapi.nets.tinyFaceDetector
      .loadFromUri(MODELS_URL)
      .then(() => setStage('ready'))
      .catch(() => setStage('model-error'))
  }, [])

  /* ── Draw bounding box on canvas ─────────────────────────────────────── */
  const drawCanvas = useCallback((img: HTMLImageElement, box: FaceBox) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width  = img.naturalWidth
    canvas.height = img.naturalHeight
    ctx.drawImage(img, 0, 0)

    const lw = Math.max(2, img.naturalWidth * 0.004)
    // Face rectangle
    ctx.strokeStyle = 'hsl(82 60% 40%)'
    ctx.lineWidth = lw
    ctx.strokeRect(box.x, box.y, box.width, box.height)

    // Corner accents
    const cl  = box.width * 0.15
    ctx.strokeStyle = 'hsl(82 80% 32%)'
    ctx.lineWidth   = lw * 1.6
    const corners: [number, number, number, number, number, number][] = [
      [box.x,             box.y + cl,           box.x,             box.y,             box.x + cl,           box.y],
      [box.x + box.width - cl, box.y,           box.x + box.width, box.y,             box.x + box.width,     box.y + cl],
      [box.x,             box.y + box.height - cl, box.x,           box.y + box.height, box.x + cl,           box.y + box.height],
      [box.x + box.width - cl, box.y + box.height, box.x + box.width, box.y + box.height, box.x + box.width, box.y + box.height - cl],
    ]
    for (const [x1, y1, x2, y2, x3, y3] of corners) {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.lineTo(x3, y3)
      ctx.stroke()
    }
  }, [])

  /* ── Draw canvas once it mounts (stage switches to preview) ─────────── */
  useEffect(() => {
    if (stage === 'preview' && pendingDraw && canvasRef.current) {
      drawCanvas(pendingDraw.img, pendingDraw.box)
    }
  }, [stage, pendingDraw, drawCanvas])

  /* ── File selected ───────────────────────────────────────────────────── */
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (file.size > MAX_FILE_SIZE) {
      setError('Ficheiro demasiado grande. O tamanho máximo é 10 MB.')
      return
    }

    setStage('detecting')
    pendingFile.current = file

    const url = URL.createObjectURL(file)
    const img  = new Image()
    img.src = url
    await new Promise<void>(res => { img.onload = () => res() })

    setImgDims({ w: img.naturalWidth, h: img.naturalHeight })

    const detections = await faceapi.detectAllFaces(
      img,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }),
    )

    // ── Validation ──────────────────────────────────────────────────────
    if (detections.length === 0) {
      URL.revokeObjectURL(url)
      setError('Nenhuma face detetada. Usa uma foto com o teu rosto bem visível e bem iluminado.')
      setStage('ready')
      return
    }
    if (detections.length > 1) {
      URL.revokeObjectURL(url)
      setError(`${detections.length} faces detetadas. A foto deve mostrar apenas 1 pessoa.`)
      setStage('ready')
      return
    }

    const det  = detections[0]
    const box  = det.box
    const area = (box.width * box.height) / (img.naturalWidth * img.naturalHeight)

    if (area < MIN_FACE_RATIO) {
      URL.revokeObjectURL(url)
      setError('Face demasiado pequena na imagem. Aproxima-te da câmara.')
      setStage('ready')
      return
    }

    const fb: FaceBox = {
      x:      Math.round(box.x),
      y:      Math.round(box.y),
      width:  Math.round(box.width),
      height: Math.round(box.height),
    }
    setFaceBox(fb)
    setPendingDraw({ img, box: fb })
    URL.revokeObjectURL(url)
    setStage('preview')
  }

  /* ── Upload to backend ───────────────────────────────────────────────── */
  const handleUpload = async () => {
    if (!pendingFile.current || !faceBox || !imgDims) return
    setStage('uploading')
    setError(null)

    const form = new FormData()
    form.append('photo',       pendingFile.current)
    form.append('faceBox',     JSON.stringify(faceBox))
    form.append('imageWidth',  String(imgDims.w))
    form.append('imageHeight', String(imgDims.h))

    try {
      const res = await fetch(`${SERVER_URL}/api/process-photo`, {
        method: 'POST',
        body: form,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Erro ao processar a imagem.')
      }

      const blob   = await res.blob()
      const base64 = await new Promise<string>(resolve => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })

      setResult(base64)
      onProcessed(base64)
      setStage('done')

    } catch (err: any) {
      const msg = err.message ?? ''
      if (msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('fetch')) {
        setError('Não foi possível ligar ao servidor de processamento de imagens. Verifica a tua ligação.')
      } else {
        setError(msg || 'Erro ao enviar a imagem.')
      }
      setStage('preview')
    }
  }

  /* ── Reset ───────────────────────────────────────────────────────────── */
  const reset = () => {
    setError(null)
    setFaceBox(null)
    setImgDims(null)
    setPendingDraw(null)
    pendingFile.current = null
    setStage('ready')
    if (fileRef.current) fileRef.current.value = ''
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  if (stage === 'model-error') {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
        Não foi possível carregar os modelos de deteção facial.{' '}
        <button onClick={() => { setStage('loading-models'); faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL).then(() => setStage('ready')).catch(() => setStage('model-error')) }}
          className="underline font-medium">
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">

      {/* ── Done: show result ── */}
      {stage === 'done' && result && (
        <div className="flex items-center gap-4">
          <img
            src={result}
            alt="Foto de perfil processada"
            className="w-20 h-20 rounded-2xl object-cover border-2 border-border shadow-sm"
          />
          <div>
            <p className="text-sm font-medium text-foreground">Foto guardada</p>
            <button onClick={reset} className="text-xs text-muted-foreground underline hover:text-foreground mt-0.5">
              Alterar foto
            </button>
          </div>
        </div>
      )}

      {/* ── Hidden file input ── */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
        disabled={stage !== 'ready'}
      />

      {/* ── Drop zone ── */}
      {(stage === 'ready' || stage === 'loading-models') && (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={stage === 'loading-models'}
          className="w-full border-2 border-dashed border-border rounded-2xl p-6 text-center
                     hover:border-primary hover:bg-muted/20 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {stage === 'loading-models' ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">A carregar modelos de deteção...</span>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground mb-0.5">Clica para escolher a foto</p>
              <p className="text-xs text-muted-foreground">JPG, PNG ou WebP · máx. 10 MB · 1 pessoa</p>
            </>
          )}
        </button>
      )}

      {/* ── Detecting ── */}
      {stage === 'detecting' && (
        <div className="flex items-center justify-center gap-2 py-5">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">A detetar face...</span>
        </div>
      )}

      {/* ── Preview with bounding box ── */}
      {stage === 'preview' && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Face detetada. Confirma e o servidor vai recortar e remover o fundo automaticamente.
          </p>
          <div className="rounded-2xl overflow-hidden border border-border bg-muted/30">
            <canvas ref={canvasRef} className="w-full h-auto max-h-64 object-contain" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Confirmar e processar
            </button>
            <button
              onClick={reset}
              className="py-2.5 px-4 rounded-xl bg-muted text-muted-foreground text-sm hover:bg-muted/70 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Uploading ── */}
      {stage === 'uploading' && (
        <div className="flex items-center justify-center gap-2 py-5">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">A processar imagem no servidor...</span>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
          <span className="text-red-500 text-sm leading-none mt-0.5">⚠</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
