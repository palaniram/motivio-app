export interface LeadRecord {
  county: 'Alameda' | 'Contra Costa' | 'San Mateo'
  lead_type: 'NOD' | 'tax_delinquent'
  owner_name: string | null
  property_address: string
  city: string | null
  zip: string | null
  filing_date: Date
  loan_amount: number | null
  trustee_name: string | null
  source: string
  source_file: string | null
  external_id: string | null
}

export interface DataSource {
  fetch(): Promise<LeadRecord[]>
}
