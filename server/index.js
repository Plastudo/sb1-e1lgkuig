import express from 'express'
import cors from 'cors'
import uploadRouter from './routes/upload.js'

const app = express()
const PORT = process.env.PORT || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || /^http:\/\/localhost:\d+$/

app.use(cors({ origin: FRONTEND_URL }))
app.use(express.json())
app.use('/api', uploadRouter)

app.listen(PORT, () => {
  console.log(`Image server → http://localhost:${PORT}`)
})
