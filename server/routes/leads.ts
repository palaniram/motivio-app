import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma.js'
import { Prisma } from '@prisma/client'

const router = Router()

/**
 * Helper: build Prisma where clause from query params.
 * Shared by GET /api/leads and GET /api/leads/stats.
 */
function buildWhereClause(query: Request['query']): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {}

  // County filter — supports comma-separated multi-select
  if (typeof query.county === 'string' && query.county.length > 0) {
    const counties = query.county.split(',').map((c) => c.trim())
    where.county = counties.length === 1 ? counties[0] : { in: counties }
  }

  // Lead type filter — supports comma-separated multi-select
  if (typeof query.leadType === 'string' && query.leadType.length > 0) {
    const types = query.leadType.split(',').map((t) => t.trim())
    where.lead_type = types.length === 1 ? types[0] : { in: types }
  }

  // Date range filter on filing_date
  if (typeof query.dateFrom === 'string' || typeof query.dateTo === 'string') {
    const filingDateFilter: Prisma.DateTimeNullableFilter = {}
    if (typeof query.dateFrom === 'string') {
      filingDateFilter.gte = new Date(query.dateFrom)
    }
    if (typeof query.dateTo === 'string') {
      filingDateFilter.lte = new Date(query.dateTo)
    }
    where.filing_date = filingDateFilter
  }

  // Enrichment-based filters require joining through the enrichment relation
  const enrichmentWhere: Prisma.EnrichmentWhereInput = {}
  let hasEnrichmentFilter = false

  // Min equity filter
  if (typeof query.minEquity === 'string') {
    const minEquity = parseFloat(query.minEquity)
    if (!isNaN(minEquity)) {
      enrichmentWhere.estimated_equity = { gte: minEquity }
      hasEnrichmentFilter = true
    }
  }

  // Property type filter
  if (typeof query.propertyType === 'string' && query.propertyType.length > 0) {
    enrichmentWhere.property_type = query.propertyType
    hasEnrichmentFilter = true
  }

  // Enriched filter — boolean
  if (typeof query.enriched === 'string') {
    if (query.enriched === 'true') {
      // Has enrichment record, optionally with additional field filters
      if (hasEnrichmentFilter) {
        where.enrichment = enrichmentWhere
      } else {
        where.enrichment = { isNot: null }
      }
      hasEnrichmentFilter = false // already applied
    } else if (query.enriched === 'false') {
      where.enrichment = { is: null }
    }
  }

  // If enrichment filters exist but enriched param wasn't set, apply them
  if (hasEnrichmentFilter) {
    where.enrichment = enrichmentWhere
  }

  return where
}

/**
 * Helper: build Prisma orderBy from sort query param.
 * days_since_filing sorts by filing_date in reverse (most recent filing = fewest days).
 */
function buildOrderBy(
  sort?: string
): Prisma.LeadOrderByWithRelationInput | Prisma.LeadOrderByWithRelationInput[] {
  switch (sort) {
    case 'filing_date':
      return { filing_date: 'desc' }
    case 'estimated_equity':
      return { enrichment: { estimated_equity: 'desc' } }
    case 'days_since_filing':
    default:
      // days_since_filing ASC = most recent filing_date first (closest to today)
      // Nulls last — leads without a filing_date go to the end
      return { filing_date: { sort: 'desc', nulls: 'last' } }
  }
}

/**
 * Helper: compute days_since_filing from a filing_date.
 */
function computeDaysSinceFiling(filingDate: Date | null): number | null {
  if (!filingDate) return null
  const now = new Date()
  const diffMs = now.getTime() - new Date(filingDate).getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Helper: format a lead record for the API response.
 * Adds computed days_since_filing and flattens Decimal types to numbers.
 */
function formatLead(lead: any) {
  const days_since_filing = computeDaysSinceFiling(lead.filing_date)

  return {
    ...lead,
    days_since_filing,
    loan_amount: lead.loan_amount != null ? Number(lead.loan_amount) : null,
    enrichment: lead.enrichment
      ? {
          ...lead.enrichment,
          estimated_value:
            lead.enrichment.estimated_value != null
              ? Number(lead.enrichment.estimated_value)
              : null,
          estimated_equity:
            lead.enrichment.estimated_equity != null
              ? Number(lead.enrichment.estimated_equity)
              : null,
          bathrooms:
            lead.enrichment.bathrooms != null
              ? Number(lead.enrichment.bathrooms)
              : null,
          last_sale_price:
            lead.enrichment.last_sale_price != null
              ? Number(lead.enrichment.last_sale_price)
              : null,
        }
      : null,
    ai_summary: lead.ai_summary ?? null,
  }
}

// ---------------------------------------------------------------------------
// GET /api/leads
// ---------------------------------------------------------------------------
router.get('/', async (req: Request, res: Response) => {
  try {
    const where = buildWhereClause(req.query)
    const orderBy = buildOrderBy(req.query.sort as string | undefined)

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50))
    const skip = (page - 1) * limit

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          enrichment: true,
          ai_summary: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ])

    const formatted = leads.map(formatLead)

    res.json({ leads: formatted, total, page })
  } catch (err) {
    console.error('GET /api/leads error:', err)
    res.status(500).json({ error: 'Failed to fetch leads' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/leads/stats
// ---------------------------------------------------------------------------
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const where = buildWhereClause(req.query)

    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Build date-constrained where clauses for 7-day and 30-day counts
    const where7Days: Prisma.LeadWhereInput = {
      ...where,
      filing_date: { gte: sevenDaysAgo },
    }
    const where30Days: Prisma.LeadWhereInput = {
      ...where,
      filing_date: { gte: thirtyDaysAgo },
    }

    // Where clause for enriched count: leads that have an enrichment record
    const whereEnriched: Prisma.LeadWhereInput = {
      ...where,
      enrichment: { isNot: null },
    }

    const [
      total,
      enrichedCount,
      filedLast7Days,
      filedLast30Days,
      byCountyRaw,
      byLeadTypeRaw,
      avgResult,
    ] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.count({ where: whereEnriched }),
      prisma.lead.count({ where: where7Days }),
      prisma.lead.count({ where: where30Days }),
      prisma.lead.groupBy({
        by: ['county'],
        where,
        _count: { id: true },
      }),
      prisma.lead.groupBy({
        by: ['lead_type'],
        where,
        _count: { id: true },
      }),
      // Compute average days since filing using raw SQL for accuracy
      prisma.$queryRaw<[{ avg_days: number | null }]>`
        SELECT AVG(CURRENT_DATE - filing_date)::float AS avg_days
        FROM leads
        WHERE filing_date IS NOT NULL
      `,
    ])

    // Transform groupBy results into { county_name: count } objects
    const byCounty: Record<string, number> = {}
    for (const row of byCountyRaw) {
      byCounty[row.county] = row._count.id
    }

    const byLeadType: Record<string, number> = {}
    for (const row of byLeadTypeRaw) {
      byLeadType[row.lead_type] = row._count.id
    }

    const avgDaysSinceFiling =
      avgResult[0]?.avg_days != null ? Math.round(avgResult[0].avg_days) : null

    res.json({
      total,
      byCounty,
      byLeadType,
      enrichedCount,
      avgDaysSinceFiling,
      filedLast7Days,
      filedLast30Days,
    })
  } catch (err) {
    console.error('GET /api/leads/stats error:', err)
    res.status(500).json({ error: 'Failed to fetch lead stats' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/leads/:id
// ---------------------------------------------------------------------------
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        enrichment: true,
        ai_summary: true,
      },
    })

    if (!lead) {
      res.status(404).json({ error: 'Lead not found' })
      return
    }

    res.json(formatLead(lead))
  } catch (err) {
    console.error('GET /api/leads/:id error:', err)
    res.status(500).json({ error: 'Failed to fetch lead' })
  }
})

export default router
