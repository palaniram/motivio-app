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

  return (
    <div className="rounded-lg border border-gray-light bg-bg-primary p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-5">
        {/* County multi-select */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-mid">
            County
          </label>
          <div className="flex gap-3">
            {COUNTIES.map((county) => (
              <label key={county} className="flex items-center gap-1.5 text-sm text-gray-dark cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCounties.includes(county)}
                  onChange={() => toggleMulti('county', county)}
                  className="rounded border-gray-light text-teal accent-teal"
                />
                {county}
              </label>
            ))}
          </div>
        </div>

        {/* Lead Type multi-select */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-mid">
            Lead Type
          </label>
          <div className="flex gap-3">
            {LEAD_TYPES.map((lt) => (
              <label key={lt.value} className="flex items-center gap-1.5 text-sm text-gray-dark cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLeadTypes.includes(lt.value)}
                  onChange={() => toggleMulti('leadType', lt.value)}
                  className="rounded border-gray-light text-teal accent-teal"
                />
                {lt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Filing date range */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-mid">
            Filing Date
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setParam('dateFrom', e.target.value)}
              className="rounded border border-gray-light px-2 py-1 text-sm text-gray-dark"
            />
            <span className="text-gray-mid text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setParam('dateTo', e.target.value)}
              className="rounded border border-gray-light px-2 py-1 text-sm text-gray-dark"
            />
          </div>
        </div>

        {/* Minimum Equity */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-mid">
            Min Equity
          </label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-mid">$</span>
            <input
              type="number"
              min={0}
              step={10000}
              placeholder="0"
              value={minEquity}
              onChange={(e) => setParam('minEquity', e.target.value)}
              className="w-28 rounded border border-gray-light px-2 py-1 text-sm text-gray-dark"
            />
          </div>
        </div>

        {/* Enrichment filter */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-mid">
            Enrichment
          </label>
          <select
            value={enriched}
            onChange={(e) => setParam('enriched', e.target.value)}
            className="rounded border border-gray-light px-2 py-1.5 text-sm text-gray-dark"
          >
            {ENRICHMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-mid">
            Sort By
          </label>
          <select
            value={sort}
            onChange={(e) => setParam('sort', e.target.value)}
            className="rounded border border-gray-light px-2 py-1.5 text-sm text-gray-dark"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
