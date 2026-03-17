import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma.js'
import { Prisma } from '@prisma/client'

const router = Router()

function buildWhereClause(query: Request['query']): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {}

  if (typeof query.county === 'string' && query.county.length > 0) {
    const counties = query.county.split(',').map((c) => c.trim())
    where.county = counties.length === 1 ? counties[0] : { in: counties }
  }

  if (typeof query.leadType === 'string' && query.leadType.length > 0) {
    const types = query.leadType.split(',').map((t) => t.trim())
    where.lead_type = types.length === 1 ? types[0] : { in: types }
  }

  if (typeof query.dateFrom === 'string' || typeof query.dateTo === 'string') {
    const filingDateFilter: Prisma.DateTimeNullableFilter = {}
    if (typeof query.dateFrom === 'string') filingDateFilter.gte = new Date(query.dateFrom)
    if (typeof query.dateTo === 'string') filingDateFilter.lte = new Date(query.dateTo)
    where.filing_date = filingDateFilter
  }

  const enrichmentWhere: Prisma.EnrichmentWhereInput = {}
  let hasEnrichmentFilter = false

  if (typeof query.minEquity === 'string') {
    const minEquity = parseFloat(query.minEquity)
    if (!isNaN(minEquity)) {
      enrichmentWhere.estimated_equity = { gte: minEquity }
      hasEnrichmentFilter = true
    }
  }

  if (typeof query.enriched === 'string') {
    if (query.enriched === 'true') {
      where.enrichment = hasEnrichmentFilter ? enrichmentWhere : { isNot: null }
      hasEnrichmentFilter = false
    } else if (query.enriched === 'false') {
      where.enrichment = { is: null }
    }
  }

  if (hasEnrichmentFilter) {
    where.enrichment = enrichmentWhere
  }

  return where
}

function escapeCsvField(value: string | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

router.get('/csv', async (req: Request, res: Response) => {
  try {
    const where = buildWhereClause(req.query)

    const leads = await prisma.lead.findMany({
      where,
      include: { enrichment: true },
      orderBy: { filing_date: { sort: 'desc', nulls: 'last' } },
    })

    const headers = [
      'County', 'Lead Type', 'Owner Name', 'Property Address', 'City', 'Zip',
      'Filing Date', 'Days Since Filing', 'Loan Amount', 'Trustee',
      'Phone 1', 'Phone 2', 'Phone 3', 'Email 1', 'Email 2',
      'Mailing Address', 'Estimated Value', 'Estimated Equity',
      'Property Type', 'Bedrooms', 'Bathrooms', 'Sq Ft', 'Year Built',
      'Last Sale Date', 'Last Sale Price', 'Source',
    ]

    const rows = leads.map((lead) => {
      const e = lead.enrichment
      const daysSinceFiling = lead.filing_date
        ? Math.floor((Date.now() - new Date(lead.filing_date).getTime()) / (1000 * 60 * 60 * 24))
        : ''
      const filingDate = lead.filing_date
        ? new Date(lead.filing_date).toISOString().split('T')[0]
        : ''
      const lastSaleDate = e?.last_sale_date
        ? new Date(e.last_sale_date).toISOString().split('T')[0]
        : ''

      return [
        lead.county,
        lead.lead_type,
        lead.owner_name,
        lead.property_address,
        lead.city,
        lead.zip,
        filingDate,
        String(daysSinceFiling),
        lead.loan_amount != null ? Number(lead.loan_amount).toString() : '',
        lead.trustee_name,
        e?.phone_1, e?.phone_2, e?.phone_3,
        e?.email_1, e?.email_2,
        e?.mailing_address,
        e?.estimated_value != null ? Number(e.estimated_value).toString() : '',
        e?.estimated_equity != null ? Number(e.estimated_equity).toString() : '',
        e?.property_type,
        e?.bedrooms != null ? String(e.bedrooms) : '',
        e?.bathrooms != null ? Number(e.bathrooms).toString() : '',
        e?.sq_ft != null ? String(e.sq_ft) : '',
        e?.year_built != null ? String(e.year_built) : '',
        lastSaleDate,
        e?.last_sale_price != null ? Number(e.last_sale_price).toString() : '',
        lead.source,
      ].map(escapeCsvField)
    })

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="motivio-leads.csv"')
    res.send(csv)
  } catch (err) {
    console.error('GET /api/export/csv error:', err)
    res.status(500).json({ error: 'Failed to export leads' })
  }
})

export default router
