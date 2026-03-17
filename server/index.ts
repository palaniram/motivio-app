import express from 'express'
import cors from 'cors'
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
app.use(cors({ origin: 'http://localhost:5173' }))
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
