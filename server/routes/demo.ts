import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { DemoDataSource } from '../services/sources/DemoDataSource.js'
import { generateMockEnrichment } from '../services/enrichment.js'

const router = Router()

router.post('/seed', async (req, res) => {
  try {
    const count = req.body?.count ?? 40

    // Clear previous demo data (cascade deletes enrichments + ai_summaries)
    await prisma.lead.deleteMany({ where: { source: 'demo' } })

    // Generate leads
    const source = new DemoDataSource(count)
    const records = await source.fetch()

    // Insert leads
    await prisma.lead.createMany({
      data: records.map((r) => ({
        ...r,
        filing_date: new Date(r.filing_date),
      })),
    })

    // Fetch inserted leads to get IDs for enrichment
    const insertedLeads = await prisma.lead.findMany({
      where: { source: 'demo' },
      select: { id: true, county: true, owner_name: true, loan_amount: true },
    })

    // Enrich ~60% of leads
    let enrichedCount = 0
    const enrichmentData = []
    for (const lead of insertedLeads) {
      if (Math.random() < 0.6) {
        const mockEnrichment = generateMockEnrichment(lead)
        enrichmentData.push({
          lead_id: lead.id,
          ...mockEnrichment,
        })
        enrichedCount++
      }
    }

    if (enrichmentData.length > 0) {
      await prisma.enrichment.createMany({ data: enrichmentData })
    }

    res.json({ seeded: records.length, enriched: enrichedCount })
  } catch (err) {
    console.error('Demo seed error:', err)
    res.status(500).json({ error: 'Failed to seed demo data' })
  }
})

export default router
