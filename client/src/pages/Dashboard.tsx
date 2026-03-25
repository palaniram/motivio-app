import { Link, useSearchParams } from 'react-router-dom'
import StatsBar from '../components/StatsBar.js'
import FilterBar from '../components/FilterBar.js'
import LeadsTable from '../components/LeadsTable.js'
import ExportButton from '../components/ExportButton.js'
import DataToolbar from '../components/DataToolbar.js'
import { useLeads, type LeadFilters } from '../hooks/useLeads.js'

function filtersFromParams(params: URLSearchParams): LeadFilters {
  const counties = params.getAll('county')
  const leadTypes = params.getAll('leadType')
  const dateFrom = params.get('dateFrom') ?? undefined
  const dateTo = params.get('dateTo') ?? undefined
  const minEquityRaw = params.get('minEquity')
  const minEquity = minEquityRaw ? Number(minEquityRaw) : undefined
  const enriched = params.get('enriched') || undefined
  const sort = params.get('sort') || 'days_since_filing'
  const pageRaw = params.get('page')
  const page = pageRaw ? Number(pageRaw) : 1

  return {
    county: counties.length > 0 ? counties : undefined,
    leadType: leadTypes.length > 0 ? leadTypes : undefined,
    dateFrom,
    dateTo,
    minEquity,
    enriched,
    sort,
    page,
    limit: 25,
  }
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = filtersFromParams(searchParams)
  const { data, isLoading, error } = useLeads(filters)

  function handlePageChange(newPage: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (newPage <= 1) {
        next.delete('page')
      } else {
        next.set('page', String(newPage))
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-bg-secondary bg-pattern">
      {/* Header */}
      <header className="glass-header sticky top-0 z-30 px-6 py-3.5">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-teal-dark shadow-[0_2px_8px_rgba(11,122,117,0.25)] group-hover:shadow-[0_4px_12px_rgba(11,122,117,0.35)] transition-shadow">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v10l4.5 4.5" />
                <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gradient">Seller Quest</h1>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-gray-light/50 bg-bg-secondary/80 px-3.5 py-1.5 text-xs font-medium text-gray-mid">
            <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
            Motivated Seller Dashboard
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-7 animate-fade-in">
        {/* Data toolbar: demo seed + CSV import */}
        <DataToolbar />

        {/* Stats */}
        <StatsBar filters={filters} />

        {/* Filter row with export */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <FilterBar />
          </div>
          <div className="flex-shrink-0 self-end lg:self-auto">
            <ExportButton filters={filters} />
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-red/20 bg-red/5 px-4 py-3 text-sm text-red">
            Failed to load leads. Please try again.
          </div>
        )}

        {/* Leads table */}
        <LeadsTable
          leads={data?.leads ?? []}
          total={data?.total ?? 0}
          page={data?.page ?? filters.page ?? 1}
          limit={filters.limit ?? 25}
          isLoading={isLoading}
          onPageChange={handlePageChange}
        />
      </main>
    </div>
  )
}
