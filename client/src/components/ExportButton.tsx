import { buildQueryString } from '../api/client.js'
import type { LeadFilters } from '../hooks/useLeads.js'

interface ExportButtonProps {
  filters: LeadFilters
}

export default function ExportButton({ filters }: ExportButtonProps) {
  function handleExport() {
    const qs = buildQueryString({
      county: filters.county,
      leadType: filters.leadType,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      minEquity: filters.minEquity,
      enriched: filters.enriched,
      sort: filters.sort,
    })
    const url = `/api/export/csv${qs}`
    window.open(url, '_blank')
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-navy to-navy-light px-4 py-2.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(13,33,55,0.25)] hover:shadow-[0_4px_12px_rgba(13,33,55,0.35)] active:scale-[0.98] transition-all duration-150"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Export CSV
    </button>
  )
}
