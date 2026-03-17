import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma.js'
import { enrichLead } from '../services/enrichment.js'

const router = Router()

router.post('/:id/enrich', async (req: Request, res: Response) => {
  try {
    const leadId = req.params.id as string

    // Verify lead exists
    const lead = await prisma.lead.findUnique({ where: { id: leadId } })
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' })
      return
    }

    const result = await enrichLead(leadId)
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('POST /api/leads/:id/enrich error:', message, err)
    res.status(500).json({ error: `Enrichment failed: ${message}` })
  }
})

export default router
