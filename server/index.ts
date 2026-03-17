import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import leadsRouter from './routes/leads.js'
import importRouter from './routes/import.js'
import exportRouter from './routes/export.js'
import summarizeRouter from './routes/summarize.js'
import enrichRouter from './routes/enrich.js'
import webhooksRouter from './routes/webhooks.js'
import demoRouter from './routes/demo.js'

const app = express()
const PORT = process.env.PORT ?? 3001

// Webhooks need raw body — mount before JSON parser
app.use('/api/webhooks', webhooksRouter)

// Middleware
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'
app.use(cors({ origin: corsOrigin }))
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/leads', leadsRouter)
app.use('/api/leads', summarizeRouter)
app.use('/api/leads', enrichRouter)
app.use('/api/import', importRouter)
app.use('/api/export', exportRouter)
app.use('/api/demo', demoRouter)

// In production, serve the client build and handle SPA fallback
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const clientDist = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
