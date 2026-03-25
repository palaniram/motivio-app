import { useSearchParams } from 'react-router-dom'

const COUNTIES = ['Alameda', 'Contra Costa', 'San Mateo'] as const
const LEAD_TYPES = [
  { value: 'NOD', label: 'NOD' },
  { value: 'tax_delinquent', label: 'Tax Delinquent' },
] as const
const SORT_OPTIONS = [
  { value: 'days_since_filing', label: 'Days Since Filing' },
  { value: 'filing_date', label: 'Filing Date' },
  { value: 'estimated_equity', label: 'Estimated Equity' },
] as const
const ENRICHMENT_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Enriched only' },
  { value: 'false', label: 'Not enriched' },
] as const

export default function FilterBar() {
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedCounties = searchParams.getAll('county')
  const selectedLeadTypes = searchParams.getAll('leadType')
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''
  const minEquity = searchParams.get('minEquity') ?? ''
  const enriched = searchParams.get('enriched') ?? ''
  const sort = searchParams.get('sort') ?? 'days_since_filing'

  const hasActiveFilters = selectedCounties.length > 0 || selectedLeadTypes.length > 0 || dateFrom || dateTo || minEquity || enriched

  function updateParams(updater: (params: URLSearchParams) => void) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      updater(next)
      // Reset to page 1 when filters change
      next.delete('page')
      return next
    })
  }

  function toggleMulti(key: string, value: string) {
    updateParams((params) => {
      const current = params.getAll(key)
      params.delete(key)
      if (current.includes(value)) {
        for (const v of current) {
          if (v !== value) params.append(key, v)
        }
      } else {
        for (const v of current) params.append(key, v)
        params.append(key, value)
      }
    })
  }

  function setParam(key: string, value: string) {
    updateParams((params) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
  }

  function clearAll() {
    setSearchParams(new URLSearchParams())
  }

  return (
    <div className="card p-5">
      {/* Filter header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy/5">
            <svg className="h-3.5 w-3.5 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-navy">Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-md border border-red/15 bg-red/5 px-2.5 py-1 text-xs font-medium text-red hover:bg-red/10 transition-colors"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear all
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-5">
        {/* County pill toggles */}
        <div>
          <label className="mb-2 block text-[0.65rem] font-bold uppercase tracking-widest text-gray-mid">
            County
          </label>
          <div className="flex gap-1.5">
            {COUNTIES.map((county) => {
              const selected = selectedCounties.includes(county)
              return (
                <button
                  key={county}
                  onClick={() => toggleMulti('county', county)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                    selected
                      ? 'border-teal bg-gradient-to-b from-teal to-teal-dark text-white shadow-[0_2px_6px_rgba(11,122,117,0.25)]'
                      : 'border-gray-light/70 bg-bg-secondary/50 text-gray-dark hover:border-teal/40 hover:bg-teal-light/30'
                  }`}
                >
                  {county}
                </button>
              )
            })}
          </div>
        </div>

        {/* Lead Type pill toggles */}
        <div>
          <label className="mb-2 block text-[0.65rem] font-bold uppercase tracking-widest text-gray-mid">
            Lead Type
          </label>
          <div className="flex gap-1.5">
            {LEAD_TYPES.map((lt) => {
              const selected = selectedLeadTypes.includes(lt.value)
              return (
                <button
                  key={lt.value}
                  onClick={() => toggleMulti('leadType', lt.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                    selected
                      ? 'border-teal bg-gradient-to-b from-teal to-teal-dark text-white shadow-[0_2px_6px_rgba(11,122,117,0.25)]'
                      : 'border-gray-light/70 bg-bg-secondary/50 text-gray-dark hover:border-teal/40 hover:bg-teal-light/30'
                  }`}
                >
                  {lt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block h-10 w-px bg-gray-light/60" />

        {/* Filing date range */}
        <div>
          <label className="mb-2 block text-[0.65rem] font-bold uppercase tracking-widest text-gray-mid">
            Filing Date
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setParam('dateFrom', e.target.value)}
              className="rounded-lg border border-gray-light/70 bg-bg-secondary/30 px-2.5 py-1.5 text-xs text-gray-dark transition-all"
            />
            <span className="text-[0.65rem] font-medium text-gray-mid uppercase">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setParam('dateTo', e.target.value)}
              className="rounded-lg border border-gray-light/70 bg-bg-secondary/30 px-2.5 py-1.5 text-xs text-gray-dark transition-all"
            />
          </div>
        </div>

        {/* Minimum Equity */}
        <div>
          <label className="mb-2 block text-[0.65rem] font-bold uppercase tracking-widest text-gray-mid">
            Min Equity
          </label>
          <div className="flex items-center rounded-lg border border-gray-light/70 bg-bg-secondary/30 transition-all focus-within:border-teal focus-within:shadow-[0_0_0_3px_rgba(11,122,117,0.12)]">
            <span className="pl-2.5 text-xs font-medium text-gray-mid">$</span>
            <input
              type="number"
              min={0}
              step={10000}
              placeholder="0"
              value={minEquity}
              onChange={(e) => setParam('minEquity', e.target.value)}
              className="w-24 border-0 bg-transparent px-1.5 py-1.5 text-xs text-gray-dark focus:ring-0 focus:shadow-none"
            />
          </div>
        </div>

        {/* Enrichment filter */}
        <div>
          <label className="mb-2 block text-[0.65rem] font-bold uppercase tracking-widest text-gray-mid">
            Enrichment
          </label>
          <div className="relative">
            <select
              value={enriched}
              onChange={(e) => setParam('enriched', e.target.value)}
              className="appearance-none rounded-lg border border-gray-light/70 bg-bg-secondary/30 pl-2.5 pr-7 py-1.5 text-xs text-gray-dark transition-all"
            >
              {ENRICHMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Sort */}
        <div>
          <label className="mb-2 block text-[0.65rem] font-bold uppercase tracking-widest text-gray-mid">
            Sort By
          </label>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="appearance-none rounded-lg border border-gray-light/70 bg-bg-secondary/30 pl-2.5 pr-7 py-1.5 text-xs text-gray-dark transition-all"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
