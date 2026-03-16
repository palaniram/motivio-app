import { useQuery } from '@tanstack/react-query'
import { apiFetch, buildQueryString } from '../api/client.js'

export interface Enrichment {
  id: string
  lead_id: string
  phone_1: string | null
  phone_2: string | null
  phone_3: string | null
  email_1: string | null
  email_2: string | null
  mailing_address: string | null
  estimated_value: number | null
  estimated_equity: number | null
  property_type: string | null
  bedrooms: number | null
  bathrooms: number | null
  sq_ft: number | null
  year_built: number | null
  last_sale_date: string | null
  last_sale_price: number | null
  enrichment_source: string | null
  enriched_at: string
}

export interface AiSummary {
  id: string
  lead_id: string
  summary: string
  model: string
  created_at: string
}

export interface Lead {
  id: string
  county: string
  lead_type: string
  owner_name: string | null
  property_address: string
  city: string | null
  zip: string | null
  filing_date: string
  days_since_filing: number
  loan_amount: number | null
  trustee_name: string | null
  source: string | null
  created_at: string
  enrichment: Enrichment | null
  ai_summary: AiSummary | null
}

export interface LeadsResponse {
  leads: Lead[]
  total: number
  page: number
}

export interface LeadFilters {
  county?: string[]
  leadType?: string[]
  dateFrom?: string
  dateTo?: string
  minEquity?: number
  enriched?: string
  sort?: string
  page?: number
  limit?: number
}

export function useLeads(filters: LeadFilters) {
  return useQuery<LeadsResponse>({
    queryKey: ['leads', filters],
    queryFn: () => {
      const qs = buildQueryString({
        county: filters.county,
        leadType: filters.leadType,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        minEquity: filters.minEquity,
        enriched: filters.enriched,
        sort: filters.sort,
        page: filters.page,
        limit: filters.limit ?? 50,
      })
      return apiFetch<LeadsResponse>(`/leads${qs}`)
    },
  })
}
