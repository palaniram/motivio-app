import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma.js'
import { summarizeLead } from '../services/summarizer.js'

const router = Router()

// Simple in-memory rate limiter keyed by IP address
// Resets daily at midnight
const rateLimitMap = new Map<string, { count: number; date: string }>()

function checkRateLimit(ip: string): boolean {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const entry = rateLimitMap.get(ip)

  if (!entry || entry.date !== today) {
    rateLimitMap.set(ip, { count: 1, date: today })
    return true
  }

  if (entry.count >= 20) {
    return false
  }

  entry.count += 1
  return true
}

router.post('/:id/summarize', async (req: Request, res: Response) => {
  try {
    const leadId = req.params.id as string

    // Verify lead exists
    const lead = await prisma.lead.findUnique({ where: { id: leadId } })
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' })
      return
    }

    // Rate limit check
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown'
    if (!checkRateLimit(clientIp)) {
      res.status(429).json({ error: 'Rate limit exceeded. Maximum 20 summarize calls per day.' })
      return
    }

    const result = await summarizeLead(leadId)
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('POST /api/leads/:id/summarize error:', message, err)
    res.status(500).json({ error: `Summary unavailable: ${message}` })
  }
})

export default router
