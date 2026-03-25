import { Link } from 'react-router-dom'
import type { Lead } from '../hooks/useLeads.js'

interface LeadsTableProps {
  leads: Lead[]
  total: number
  page: number
  limit: number
  isLoading: boolean
  onPageChange: (page: number) => void
}

function urgencyDot(days: number): string {
  if (days <= 30) return 'bg-red shadow-[0_0_6px_2px_rgba(155,35,53,0.4)]'
  if (days <= 60) return 'bg-gold shadow-[0_0_6px_2px_rgba(200,144,42,0.3)]'
  return 'bg-gray-mid'
}

function urgencyRowBorder(days: number): string {
  if (days <= 30) return 'border-l-[3px] border-l-red'
  if (days <= 60) return 'border-l-[3px] border-l-gold'
  return 'border-l-[3px] border-l-transparent'
}

function urgencyDaysColor(days: number): string {
  if (days <= 30) return 'text-red'
  if (days <= 60) return 'text-gold'
  return 'text-gray-dark'
}

function formatEquity(value: number | null | undefined): string {
  if (value == null) return '--'
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`
  return `$${value}`
}

function leadTypeLabel(type: string): string {
  if (type === 'NOD') return 'NOD'
  if (type === 'tax_delinquent') return 'Tax Delinquent'
  return type
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className={`border-b border-gray-light ${i % 2 === 1 ? 'bg-bg-secondary' : 'bg-bg-primary'}`}>
          <td className="px-4 py-3.5"><div className="h-3.5 w-3.5 skeleton rounded-full" /></td>
          <td className="px-4 py-3.5"><div className="h-4 w-28 skeleton" /></td>
          <td className="px-4 py-3.5"><div className="h-4 w-44 skeleton" /></td>
          <td className="px-4 py-3.5"><div className="h-4 w-20 skeleton" /></td>
          <td className="px-4 py-3.5"><div className="h-5 w-16 skeleton rounded-full" /></td>
          <td className="px-4 py-3.5"><div className="h-4 w-8 skeleton" /></td>
          <td className="px-4 py-3.5"><div className="h-4 w-14 skeleton" /></td>
          <td className="px-4 py-3.5"><div className="h-5 w-16 skeleton rounded-full" /></td>
          <td className="px-4 py-3.5"><div className="h-6 w-12 skeleton rounded" /></td>
        </tr>
      ))}
    </>
  )
}

export default function LeadsTable({ leads, total, page, limit, isLoading, onPageChange }: LeadsTableProps) {
  const totalPages = Math.ceil(total / limit)

  if (!isLoading && total === 0 && leads.length === 0) {
    return (
      <div className="rounded-lg border border-gray-light bg-bg-primary py-16 text-center shadow-sm">
        <svg className="mx-auto h-12 w-12 text-gray-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="mt-4 text-gray-mid">No leads match your filters. Try adjusting the date range or county selection.</p>
      </div>
    )
  }

  const startRecord = (page - 1) * limit + 1
  const endRecord = Math.min(page * limit, total)

  // Generate page numbers to show
  function getPageNumbers(): (number | 'ellipsis')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | 'ellipsis')[] = [1]
    if (page > 3) pages.push('ellipsis')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages)
    return pages
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-mid">
          <span className="text-lg font-bold text-navy">{total.toLocaleString()}</span>{' '}
          {total === 1 ? 'lead' : 'leads'} found
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-premium w-full text-left text-sm">
            <thead>
              <tr>
                <th className="w-10"></th>
                <th>Owner Name</th>
                <th>Property Address</th>
                <th>County</th>
                <th>Lead Type</th>
                <th>Days</th>
                <th>Est. Equity</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : (
                leads.map((lead, i) => {
                  const equity = lead.enrichment?.estimated_equity ?? null
                  const isEnriched = lead.enrichment != null

                  return (
                    <tr
                      key={lead.id}
                      className={`group ${urgencyRowBorder(lead.days_since_filing)} ${i % 2 === 1 ? 'bg-bg-secondary/50' : 'bg-bg-primary'} hover:bg-teal-light/30 cursor-pointer`}
                    >
                      {/* Urgency dot */}
                      <td>
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${urgencyDot(lead.days_since_filing)} ${lead.days_since_filing <= 30 ? 'urgency-pulse' : ''}`}
                          style={{ color: lead.days_since_filing <= 30 ? 'rgba(155,35,53,0.3)' : lead.days_since_filing <= 60 ? 'rgba(200,144,42,0.25)' : 'transparent' }}
                          title={`${lead.days_since_filing} days since filing`}
                        />
                      </td>

                      {/* Owner Name */}
                      <td className="font-medium text-gray-dark">
                        {lead.owner_name ?? '--'}
                      </td>

                      {/* Property Address */}
                      <td className="text-gray-dark">
                        <span className="text-gray-dark">{lead.property_address}</span>
                        {lead.city && <span className="text-gray-mid">, {lead.city}</span>}
                      </td>

                      {/* County */}
                      <td className="text-gray-mid">{lead.county}</td>

                      {/* Lead Type pill */}
                      <td>
                        <span
                          className={`pill ${
                            lead.lead_type === 'NOD'
                              ? 'bg-red/8 text-red border border-red/15'
                              : 'bg-gold/8 text-gold border border-gold/15'
                          }`}
                        >
                          {leadTypeLabel(lead.lead_type)}
                        </span>
                      </td>

                      {/* Days Since Filing */}
                      <td className={`font-bold tabular-nums ${urgencyDaysColor(lead.days_since_filing)}`}>
                        {lead.days_since_filing}
                      </td>

                      {/* Estimated Equity */}
                      <td className={`font-semibold tabular-nums ${equity != null && equity > 200000 ? 'text-green' : 'text-gray-dark'}`}>
                        {formatEquity(equity)}
                      </td>

                      {/* Enrichment Status */}
                      <td>
                        {isEnriched ? (
                          <span className="pill bg-teal/8 text-teal border border-teal/15">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Enriched
                          </span>
                        ) : null}
                      </td>

                      {/* Actions */}
                      <td>
                        <Link
                          to={`/leads/${lead.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-teal/20 bg-teal/5 px-3 py-1.5 text-xs font-semibold text-teal opacity-0 group-hover:opacity-100 hover:bg-teal hover:text-white hover:border-teal transition-all duration-150"
                        >
                          View
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-gray-mid">
            Showing <span className="font-semibold text-gray-dark">{startRecord}–{endRecord}</span> of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-light/70 px-3 py-1.5 text-xs font-medium text-gray-mid hover:bg-bg-primary hover:text-gray-dark hover:border-gray-light disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>

            {getPageNumbers().map((p, i) =>
              p === 'ellipsis' ? (
                <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-gray-mid">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`min-w-[2rem] rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${
                    p === page
                      ? 'bg-gradient-to-b from-teal to-teal-dark text-white shadow-[0_2px_6px_rgba(11,122,117,0.3)]'
                      : 'text-gray-mid hover:bg-bg-primary hover:text-gray-dark'
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-light/70 px-3 py-1.5 text-xs font-medium text-gray-mid hover:bg-bg-primary hover:text-gray-dark hover:border-gray-light disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
