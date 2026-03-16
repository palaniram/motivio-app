import { LeadRecord } from './sources/DataSource.js'

type County = LeadRecord['county']
type LeadType = LeadRecord['lead_type']

/**
 * Parse MM/DD/YYYY date format (Alameda, Contra Costa)
 */
function parseUSDate(dateStr: string): Date {
  const trimmed = dateStr.trim()
  const parts = trimmed.split('/')
  if (parts.length !== 3) {
    throw new Error(`Invalid date format (expected MM/DD/YYYY): "${dateStr}"`)
  }
  const [month, day, year] = parts
  const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`)
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date value: "${dateStr}"`)
  }
  return date
}

/**
 * Parse YYYY-MM-DD date format (San Mateo)
 */
function parseISODate(dateStr: string): Date {
  const trimmed = dateStr.trim()
  const date = new Date(`${trimmed}T00:00:00`)
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date value: "${dateStr}"`)
  }
  return date
}

/**
 * Try to extract a numeric value from a string (removes $, commas, etc.)
 */
function parseAmount(value: string | undefined | null): number | null {
  if (!value) return null
  const cleaned = value.replace(/[$,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

/**
 * Find a value from a row by trying multiple possible column names (case-insensitive).
 */
function findField(row: Record<string, string>, ...keys: string[]): string | null {
  for (const key of keys) {
    const lowerKey = key.toLowerCase()
    for (const [rowKey, rowValue] of Object.entries(row)) {
      if (rowKey.toLowerCase().trim() === lowerKey && rowValue?.trim()) {
        return rowValue.trim()
      }
    }
  }
  return null
}

/**
 * Extract zip code from an address or a dedicated zip field.
 */
function extractZip(row: Record<string, string>): string | null {
  const zip = findField(row, 'Zip', 'Zip Code', 'Zipcode', 'ZIP', 'Postal Code', 'Situs Zip')
  if (zip) {
    // Take only the first 5 digits if it's a ZIP+4
    return zip.replace(/[^0-9]/g, '').slice(0, 5) || null
  }
  return null
}

/**
 * Normalizer for Alameda County CSV rows.
 * - Owner: "Trustor" or "Grantor"
 * - Date: MM/DD/YYYY
 * - Address: split across "Situs Address" + "Situs City"
 * - Doc type: "NOTICE OF DEFAULT"
 */
export function normalizeAlameda(
  row: Record<string, string>,
  sourceFile: string,
  leadType: LeadType = 'NOD'
): LeadRecord {
  const ownerName = findField(row, 'Trustor', 'Grantor')
  const address = findField(row, 'Situs Address', 'Site Address', 'Property Address', 'Address')
  if (!address) {
    throw new Error('Missing property address in Alameda row')
  }

  const city = findField(row, 'Situs City', 'City')
  const zip = extractZip(row)

  const dateStr = findField(row, 'Recording Date', 'Filing Date', 'Date', 'Recorded Date', 'Record Date')
  if (!dateStr) {
    throw new Error('Missing filing date in Alameda row')
  }
  const filingDate = parseUSDate(dateStr)

  const loanAmount = parseAmount(findField(row, 'Loan Amount', 'Original Loan Amount', 'Default Amount', 'Amount'))
  const trusteeName = findField(row, 'Trustee', 'Trustee Name')

  return {
    county: 'Alameda',
    lead_type: leadType,
    owner_name: ownerName,
    property_address: address,
    city,
    zip,
    filing_date: filingDate,
    loan_amount: loanAmount,
    trustee_name: trusteeName,
    source: 'csv_import',
    source_file: sourceFile,
    external_id: findField(row, 'Document Number', 'Doc Number', 'Record ID', 'APN'),
  }
}

/**
 * Normalizer for Contra Costa County CSV rows.
 * - Owner: "Owner Name"
 * - Date: MM/DD/YYYY
 * - Address: "Property Address" single field
 * - Doc type: "NOTICE OF DEFAULT" or "NOD"
 */
export function normalizeContraCosta(
  row: Record<string, string>,
  sourceFile: string,
  leadType: LeadType = 'NOD'
): LeadRecord {
  const ownerName = findField(row, 'Owner Name', 'Owner', 'Grantor', 'Trustor')
  const address = findField(row, 'Property Address', 'Address', 'Situs Address', 'Site Address')
  if (!address) {
    throw new Error('Missing property address in Contra Costa row')
  }

  const city = findField(row, 'City', 'Situs City')
  const zip = extractZip(row)

  const dateStr = findField(row, 'Recording Date', 'Filing Date', 'Date', 'Recorded Date', 'Record Date')
  if (!dateStr) {
    throw new Error('Missing filing date in Contra Costa row')
  }
  const filingDate = parseUSDate(dateStr)

  const loanAmount = parseAmount(findField(row, 'Loan Amount', 'Original Loan Amount', 'Default Amount', 'Amount'))
  const trusteeName = findField(row, 'Trustee', 'Trustee Name')

  return {
    county: 'Contra Costa',
    lead_type: leadType,
    owner_name: ownerName,
    property_address: address,
    city,
    zip,
    filing_date: filingDate,
    loan_amount: loanAmount,
    trustee_name: trusteeName,
    source: 'csv_import',
    source_file: sourceFile,
    external_id: findField(row, 'Document Number', 'Doc Number', 'Record ID', 'APN'),
  }
}

/**
 * Normalizer for San Mateo County CSV rows.
 * - Owner: "Trustor"
 * - Date: YYYY-MM-DD (ISO)
 * - Address: "Property Street Address"
 * - Some records have legal description only — flag these for manual review
 */
export function normalizeSanMateo(
  row: Record<string, string>,
  sourceFile: string,
  leadType: LeadType = 'NOD'
): LeadRecord {
  const ownerName = findField(row, 'Trustor', 'Grantor', 'Owner Name', 'Owner')
  const address = findField(row, 'Property Street Address', 'Property Address', 'Address', 'Situs Address', 'Site Address')

  // San Mateo: some records have legal description only — flag for manual review
  if (!address) {
    const legalDesc = findField(row, 'Legal Description', 'Legal Desc')
    const apn = findField(row, 'APN', 'Parcel Number', 'Parcel')
    const placeholder = apn
      ? `[APN: ${apn} — needs address lookup]`
      : legalDesc
        ? `[Legal desc only — needs address lookup]`
        : null
    if (!placeholder) {
      throw new Error('Missing property address in San Mateo row')
    }
    // Use the placeholder so we don't skip the record
    return {
      county: 'San Mateo',
      lead_type: leadType,
      owner_name: ownerName,
      property_address: placeholder,
      city: findField(row, 'City', 'Situs City'),
      zip: extractZip(row),
      filing_date: parseSanMateoDate(row),
      loan_amount: parseAmount(findField(row, 'Loan Amount', 'Original Loan Amount', 'Default Amount', 'Amount')),
      trustee_name: findField(row, 'Trustee', 'Trustee Name'),
      source: 'csv_import',
      source_file: sourceFile,
      external_id: findField(row, 'Document Number', 'Doc Number', 'Record ID', 'APN'),
    }
  }

  const city = findField(row, 'City', 'Situs City')
  const zip = extractZip(row)
  const filingDate = parseSanMateoDate(row)
  const loanAmount = parseAmount(findField(row, 'Loan Amount', 'Original Loan Amount', 'Default Amount', 'Amount'))
  const trusteeName = findField(row, 'Trustee', 'Trustee Name')

  return {
    county: 'San Mateo',
    lead_type: leadType,
    owner_name: ownerName,
    property_address: address,
    city,
    zip,
    filing_date: filingDate,
    loan_amount: loanAmount,
    trustee_name: trusteeName,
    source: 'csv_import',
    source_file: sourceFile,
    external_id: findField(row, 'Document Number', 'Doc Number', 'Record ID', 'APN'),
  }
}

function parseSanMateoDate(row: Record<string, string>): Date {
  const dateStr = findField(row, 'Recording Date', 'Filing Date', 'Date', 'Recorded Date', 'Record Date')
  if (!dateStr) {
    throw new Error('Missing filing date in San Mateo row')
  }
  // San Mateo uses YYYY-MM-DD format
  return parseISODate(dateStr)
}

/**
 * Main normalize dispatcher. Routes to the correct county normalizer.
 */
export function normalize(
  row: Record<string, string>,
  county: string,
  leadType: string,
  sourceFile: string
): LeadRecord {
  const validLeadTypes: LeadType[] = ['NOD', 'tax_delinquent']
  const lt = validLeadTypes.includes(leadType as LeadType)
    ? (leadType as LeadType)
    : 'NOD'

  switch (county) {
    case 'Alameda':
      return normalizeAlameda(row, sourceFile, lt)
    case 'Contra Costa':
      return normalizeContraCosta(row, sourceFile, lt)
    case 'San Mateo':
      return normalizeSanMateo(row, sourceFile, lt)
    default:
      throw new Error(`Unsupported county: "${county}". Supported: Alameda, Contra Costa, San Mateo`)
  }
}
