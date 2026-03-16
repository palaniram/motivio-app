import prisma from '../lib/prisma.js'
import anthropic from '../lib/claude.js'

const SYSTEM_PROMPT = `You are a real estate investment analyst helping Bay Area investors quickly evaluate distressed seller leads. You receive structured data about a pre-foreclosure or tax-delinquent property and write a concise 2–3 sentence summary that tells the investor:
1. The urgency of the situation (days since filing, timeline pressure)
2. The financial opportunity (estimated equity, property value)
3. One sentence on what makes this lead worth calling or skipping

Write in plain English. Be specific — use actual numbers from the data.
Never use jargon the investor wouldn't use themselves.
Do not make up information not present in the data.
If a field is missing, work with what you have — do not mention gaps.
Output only the summary text — no labels, no bullets, no formatting.`

function buildUserMessage(lead: any, enrichment: any): string {
  const daysSinceFiling = lead.filing_date
    ? Math.floor((Date.now() - new Date(lead.filing_date).getTime()) / (1000 * 60 * 60 * 24))
    : null

  const hasPhone = enrichment
    ? [enrichment.phone_1, enrichment.phone_2, enrichment.phone_3].filter(Boolean).length
    : 0
  const hasEmail = enrichment
    ? [enrichment.email_1, enrichment.email_2].filter(Boolean).length
    : 0

  const lines = [
    `Lead type: ${lead.lead_type}`,
    `County: ${lead.county}`,
    `Property: ${lead.property_address}, ${lead.city ?? ''} ${lead.zip ?? ''}`.trim(),
    `Owner: ${lead.owner_name ?? 'Unknown'}`,
    `Filing date: ${lead.filing_date ? new Date(lead.filing_date).toLocaleDateString('en-US') : 'Unknown'}${daysSinceFiling != null ? ` (${daysSinceFiling} days ago)` : ''}`,
    `Loan amount in default: ${lead.loan_amount != null ? `$${Number(lead.loan_amount).toLocaleString()}` : 'Unknown'}`,
    `Trustee: ${lead.trustee_name ?? 'Unknown'}`,
  ]

  if (enrichment) {
    lines.push(
      `Estimated property value: ${enrichment.estimated_value != null ? `$${Number(enrichment.estimated_value).toLocaleString()}` : 'Unknown'}`,
      `Estimated equity: ${enrichment.estimated_equity != null ? `$${Number(enrichment.estimated_equity).toLocaleString()}` : 'Unknown'}`,
      `Property type: ${enrichment.property_type ?? 'Unknown'}`,
      `Bedrooms/Bathrooms: ${enrichment.bedrooms ?? '?'}bd / ${enrichment.bathrooms != null ? Number(enrichment.bathrooms) : '?'}ba`,
      `Last sale: ${enrichment.last_sale_price != null ? `$${Number(enrichment.last_sale_price).toLocaleString()}` : 'Unknown'} on ${enrichment.last_sale_date ? new Date(enrichment.last_sale_date).toLocaleDateString('en-US') : 'Unknown'}`,
    )
  }

  lines.push(`Contact info available: ${hasPhone} phone, ${hasEmail} email`)

  return lines.join('\n')
}

export async function summarizeLead(
  leadId: string
): Promise<{ summary: string; cached: boolean }> {
  // Check cache first
  const cached = await prisma.aiSummary.findUnique({
    where: { lead_id: leadId },
  })

  if (cached) {
    return { summary: cached.summary, cached: true }
  }

  // Fetch lead + enrichment
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { enrichment: true },
  })

  if (!lead) {
    throw new Error('Lead not found')
  }

  const userMessage = buildUserMessage(lead, lead.enrichment)

  // Call Claude API with 10s timeout via AbortController
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await anthropic.messages.create(
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      },
      { signal: controller.signal as any }
    )

    clearTimeout(timeout)

    const summaryText =
      response.content[0].type === 'text' ? response.content[0].text : ''

    const promptTokens = response.usage?.input_tokens ?? null
    const outputTokens = response.usage?.output_tokens ?? null

    // Upsert summary (one per lead)
    await prisma.aiSummary.upsert({
      where: { lead_id: leadId },
      update: {
        summary: summaryText,
        model: 'claude-sonnet-4-20250514',
        prompt_tokens: promptTokens,
        output_tokens: outputTokens,
        created_at: new Date(),
      },
      create: {
        lead_id: leadId,
        summary: summaryText,
        model: 'claude-sonnet-4-20250514',
        prompt_tokens: promptTokens,
        output_tokens: outputTokens,
      },
    })

    return { summary: summaryText, cached: false }
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}
