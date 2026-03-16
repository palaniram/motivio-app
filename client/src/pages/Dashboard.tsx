import { useSearchParams } from 'react-router-dom'
import StatsBar from '../components/StatsBar.js'
import FilterBar from '../components/FilterBar.js'
import LeadsTable from '../components/LeadsTable.js'
import ExportButton from '../components/ExportButton.js'
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
    limit: 50,
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
    <div className="min-h-screen bg-bg-secondary">
      {/* Header */}
      <header className="border-b border-gray-light bg-bg-primary px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <h1 className="text-xl font-bold text-navy">MotivIO</h1>
          <span className="text-sm text-gray-mid">Motivated Seller Dashboard</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-5">
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
          limit={filters.limit ?? 50}
          isLoading={isLoading}
          onPageChange={handlePageChange}
        />
      </main>
    </div>
  )
}
