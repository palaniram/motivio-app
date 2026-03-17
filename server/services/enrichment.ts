import prisma from '../lib/prisma.js'

const AREA_CODES: Record<string, string[]> = {
  Alameda: ['510', '341'],
  'Contra Costa': ['925', '510'],
  'San Mateo': ['650', '415'],
}

const PROPERTY_TYPES = ['SFR', 'SFR', 'SFR', 'SFR', 'Condo', 'Multi-family', 'Land']

const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'aol.com', 'icloud.com']

const STREET_NAMES = [
  'Oak St', 'Elm Ave', 'Cedar Blvd', 'Pine Dr', 'Maple Way',
  'Park Ave', 'Lake Dr', 'Hill Rd', 'Valley Ln', 'Bay Ct',
]

const CITIES: Record<string, string[]> = {
  Alameda: ['Oakland', 'Berkeley', 'Fremont', 'Hayward', 'Pleasanton'],
  'Contra Costa': ['Walnut Creek', 'Concord', 'Richmond', 'Antioch', 'Martinez'],
  'San Mateo': ['San Mateo', 'Redwood City', 'Daly City', 'Foster City', 'Burlingame'],
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generatePhone(county: string): string {
  const codes = AREA_CODES[county] ?? ['510']
  const area = randPick(codes)
  const mid = randInt(200, 999)
  const last = randInt(1000, 9999)
  return `(${area}) ${mid}-${last}`
}

function generateEmail(ownerName: string | null): string {
  if (ownerName) {
    const parts = ownerName.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/)
    if (parts.length >= 2) {
      const first = parts[0][0]
      const last = parts[parts.length - 1]
      return `${first}${last}${randInt(1, 99)}@${randPick(EMAIL_DOMAINS)}`
    }
    if (parts.length === 1 && parts[0]) {
      return `${parts[0]}${randInt(10, 999)}@${randPick(EMAIL_DOMAINS)}`
    }
  }
  return `investor${randInt(100, 9999)}@${randPick(EMAIL_DOMAINS)}`
}

function generateMailingAddress(county: string): string {
  const num = randInt(100, 9999)
  const street = randPick(STREET_NAMES)
  const city = randPick(CITIES[county] ?? ['Oakland'])
  const zip = randInt(94000, 94999)
  return `${num} ${street}, ${city}, CA ${zip}`
}

export function generateMockEnrichment(lead: {
  county: string
  owner_name: string | null
  loan_amount: any
}) {
  const county = lead.county
  const phoneCount = randInt(1, 3)
  const phones = Array.from({ length: phoneCount }, () => generatePhone(county))

  const emailCount = randInt(1, 2)
  const emails = Array.from({ length: emailCount }, () => generateEmail(lead.owner_name))

  // 30% chance mailing address differs from property
  const hasDifferentMailing = Math.random() < 0.3
  const mailingAddress = hasDifferentMailing ? generateMailingAddress(county) : null

  const estimatedValue = randInt(400, 1500) * 1000
  const loanAmount = lead.loan_amount ? Number(lead.loan_amount) : estimatedValue * 0.6
  const estimatedEquity = Math.max(0, estimatedValue - loanAmount)

  const propertyType = randPick(PROPERTY_TYPES)
  const bedrooms = propertyType === 'Land' ? null : randInt(2, 5)
  const bathrooms = propertyType === 'Land' ? null : randInt(1, 3)
  const sqFt = propertyType === 'Land' ? null : randInt(900, 3500)
  const yearBuilt = propertyType === 'Land' ? null : randInt(1950, 2015)

  const lastSaleYear = randInt(2015, 2023)
  const lastSaleMonth = randInt(1, 12)
  const lastSaleDay = randInt(1, 28)
  const lastSaleDate = new Date(lastSaleYear, lastSaleMonth - 1, lastSaleDay)
  const lastSalePrice = Math.round(estimatedValue * (0.6 + Math.random() * 0.2))

  return {
    phone_1: phones[0] ?? null,
    phone_2: phones[1] ?? null,
    phone_3: phones[2] ?? null,
    email_1: emails[0] ?? null,
    email_2: emails[1] ?? null,
    mailing_address: mailingAddress,
    estimated_value: estimatedValue,
    estimated_equity: estimatedEquity,
    property_type: propertyType,
    bedrooms,
    bathrooms,
    sq_ft: sqFt,
    year_built: yearBuilt,
    last_sale_date: lastSaleDate,
    last_sale_price: lastSalePrice,
    enrichment_source: 'mock',
    raw_response: { mock: true, generated_at: new Date().toISOString() },
  }
}

export async function enrichLead(
  leadId: string
): Promise<{ enrichment: any; cached: boolean }> {
  // Check cache first
  const existing = await prisma.enrichment.findUnique({
    where: { lead_id: leadId },
  })

  if (existing) {
    return { enrichment: existing, cached: true }
  }

  // Fetch lead to get county and owner_name for mock generation
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  })

  if (!lead) {
    throw new Error('Lead not found')
  }

  const mockData = generateMockEnrichment(lead)

  const enrichment = await prisma.enrichment.create({
    data: {
      lead_id: leadId,
      ...mockData,
    },
  })

  return { enrichment, cached: false }
}
