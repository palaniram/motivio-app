import type { DataSource, LeadRecord } from './DataSource.js'

type County = 'Alameda' | 'Contra Costa' | 'San Mateo'

const OWNER_NAMES = [
  'David Chen', 'Maria Rodriguez', 'James Williams', 'Priya Patel',
  'Robert Kim', 'Linda Nguyen', 'Michael Johnson', 'Fatima Al-Hassan',
  'Thomas O\'Brien', 'Susan Park', 'Carlos Hernandez', 'Jennifer Lee',
  'Anthony Davis', 'Patricia Martinez', 'Richard Singh', 'Angela Thompson',
  'Kevin Yamamoto', 'Diane Foster', 'Brian Gonzalez', 'Sandra Chang',
  'Steven Reyes', 'Nancy White', 'George Santos', 'Helen Wu',
  'Edward Brown', 'Margaret Choi', 'Daniel Rivera', 'Lisa Tanaka',
  'Christopher Moore', 'Karen Delgado', 'Joseph Taylor', 'Betty Huang',
  'Frank Medina', 'Dorothy Sharma', 'Raymond Cruz', 'Virginia Tran',
  'Walter Scott', 'Deborah Flores', 'Peter Nakamura', 'Sarah Anderson',
]

const STREETS: Record<County, string[]> = {
  Alameda: [
    'International Blvd', 'MacArthur Blvd', 'Telegraph Ave', 'Shattuck Ave',
    'San Pablo Ave', 'Foothill Blvd', 'Hesperian Blvd', 'Mission Blvd',
    'Mowry Ave', 'Fremont Blvd', 'Stanley Blvd', 'Paseo Padre Pkwy',
  ],
  'Contra Costa': [
    'Mt Diablo Blvd', 'Ygnacio Valley Rd', 'Clayton Rd', 'Treat Blvd',
    'Contra Costa Blvd', 'Monument Blvd', 'Willow Pass Rd', 'San Pablo Dam Rd',
    'Alhambra Ave', 'Pacheco Blvd', 'Arnold Dr', 'Reliez Valley Rd',
  ],
  'San Mateo': [
    'El Camino Real', 'Woodside Rd', 'Ralston Ave', 'Hillsdale Blvd',
    'Peninsula Ave', 'Crystal Springs Rd', 'Alameda de las Pulgas',
    'Middlefield Rd', 'Broadway', 'Delaware St', 'Veterans Blvd', 'Palm Ave',
  ],
}

const CITIES: Record<County, { name: string; zip: string }[]> = {
  Alameda: [
    { name: 'Oakland', zip: '94601' }, { name: 'Oakland', zip: '94607' },
    { name: 'Berkeley', zip: '94702' }, { name: 'Fremont', zip: '94536' },
    { name: 'Hayward', zip: '94541' }, { name: 'Pleasanton', zip: '94566' },
    { name: 'Alameda', zip: '94501' }, { name: 'Livermore', zip: '94550' },
  ],
  'Contra Costa': [
    { name: 'Walnut Creek', zip: '94596' }, { name: 'Concord', zip: '94520' },
    { name: 'Richmond', zip: '94801' }, { name: 'Antioch', zip: '94509' },
    { name: 'Martinez', zip: '94553' }, { name: 'Pittsburg', zip: '94565' },
    { name: 'Brentwood', zip: '94513' }, { name: 'Pleasant Hill', zip: '94523' },
  ],
  'San Mateo': [
    { name: 'San Mateo', zip: '94401' }, { name: 'Redwood City', zip: '94063' },
    { name: 'Daly City', zip: '94015' }, { name: 'Foster City', zip: '94404' },
    { name: 'Burlingame', zip: '94010' }, { name: 'San Bruno', zip: '94066' },
    { name: 'Pacifica', zip: '94044' }, { name: 'Belmont', zip: '94002' },
  ],
}

const TRUSTEES = [
  'Cal-Western Reconveyance Corp',
  'Quality Loan Service Corp',
  'NBS Default Services LLC',
  'Barrett Daffin Frappier Treder & Weiss LLP',
  'Clear Recon Corp',
  'Prestige Default Services',
  'National Default Servicing Corp',
  'Zieve Brodnax & Steele LLP',
]

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function weightedCounty(): County {
  const r = Math.random()
  if (r < 0.4) return 'Alameda'
  if (r < 0.75) return 'Contra Costa'
  return 'San Mateo'
}

function weightedFilingDate(): Date {
  const now = new Date()
  const r = Math.random()
  let daysAgo: number
  if (r < 0.5) daysAgo = randInt(1, 30)        // 50% last 30 days
  else if (r < 0.8) daysAgo = randInt(31, 60)   // 30% 31-60 days
  else daysAgo = randInt(61, 90)                 // 20% 61-90 days

  const date = new Date(now)
  date.setDate(date.getDate() - daysAgo)
  return date
}

function loanAmountForCounty(county: County): number {
  const ranges: Record<County, [number, number]> = {
    Alameda: [250000, 950000],
    'Contra Costa': [250000, 850000],
    'San Mateo': [400000, 1200000],
  }
  const [min, max] = ranges[county]
  return Math.round(randInt(min / 1000, max / 1000) * 1000)
}

export class DemoDataSource implements DataSource {
  private count: number

  constructor(count = 40) {
    this.count = count
  }

  async fetch(): Promise<LeadRecord[]> {
    const leads: LeadRecord[] = []
    const usedKeys = new Set<string>()

    for (let i = 0; i < this.count; i++) {
      const county = weightedCounty()
      const cityInfo = randPick(CITIES[county])
      const street = randPick(STREETS[county])
      const houseNum = randInt(100, 9999)
      const address = `${houseNum} ${street}`
      const filingDate = weightedFilingDate()

      // Guarantee unique address+date combos
      const key = `${address}|${filingDate.toISOString().slice(0, 10)}`
      if (usedKeys.has(key)) {
        i--
        continue
      }
      usedKeys.add(key)

      const leadType = Math.random() < 0.75 ? 'NOD' : 'tax_delinquent'

      leads.push({
        county,
        lead_type: leadType,
        owner_name: randPick(OWNER_NAMES),
        property_address: address,
        city: cityInfo.name,
        zip: cityInfo.zip,
        filing_date: filingDate,
        loan_amount: loanAmountForCounty(county),
        trustee_name: leadType === 'NOD' ? randPick(TRUSTEES) : null,
        source: 'demo',
        source_file: null,
        external_id: null,
      })
    }

    return leads
  }
}
