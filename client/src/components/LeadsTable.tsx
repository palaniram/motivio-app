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

function urgencyColor(days: number): string {
  if (days <= 30) return 'bg-red'
  if (days <= 60) return 'bg-gold'
  return 'bg-gray-mid'
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

export default function LeadsTable({ leads, total, page, limit, isLoading, onPageChange }: LeadsTableProps) {
  const totalPages = Math.ceil(total / limit)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-gray-mid text-sm">Loading leads...</div>
      </div>
    )
  }

  if (total === 0 && leads.length === 0) {
    return (
      <div className="rounded-lg border border-gray-light bg-bg-primary py-16 text-center">
        <p className="text-gray-mid">No leads match your filters. Try adjusting the date range or county selection.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-gray-mid">
        {total.toLocaleString()} {total === 1 ? 'lead' : 'leads'}
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-light shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-light bg-bg-secondary">
              <th className="w-10 px-4 py-3"></th>
              <th className="px-4 py-3 font-semibold text-gray-mid">Owner Name</th>
              <th className="px-4 py-3 font-semibold text-gray-mid">Property Address</th>
              <th className="px-4 py-3 font-semibold text-gray-mid">County</th>
              <th className="px-4 py-3 font-semibold text-gray-mid">Lead Type</th>
              <th className="px-4 py-3 font-semibold text-gray-mid">Days</th>
              <th className="px-4 py-3 font-semibold text-gray-mid">Est. Equity</th>
              <th className="px-4 py-3 font-semibold text-gray-mid">Status</th>
              <th className="px-4 py-3 font-semibold text-gray-mid"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, i) => {
              const equity = lead.enrichment?.estimated_equity ?? null
              const isEnriched = lead.enrichment != null

              return (
                <tr
                  key={lead.id}
                  className={`border-b border-gray-light ${i % 2 === 1 ? 'bg-bg-secondary' : 'bg-bg-primary'} hover:bg-teal-light/40 transition-colors`}
                >
                  {/* Urgency dot */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${urgencyColor(lead.days_since_filing)}`}
                      title={`${lead.days_since_filing} days since filing`}
                    />
                  </td>

                  {/* Owner Name */}
                  <td className="px-4 py-3 text-gray-dark">
                    {lead.owner_name ?? '--'}
                  </td>

                  {/* Property Address */}
                  <td className="px-4 py-3 text-gray-dark">
                    {lead.property_address}
                    {lead.city ? `, ${lead.city}` : ''}
                  </td>

                  {/* County */}
                  <td className="px-4 py-3 text-gray-dark">{lead.county}</td>

                  {/* Lead Type pill */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        lead.lead_type === 'NOD'
                          ? 'bg-red/10 text-red'
                          : 'bg-gold/10 text-gold'
                      }`}
                    >
                      {leadTypeLabel(lead.lead_type)}
                    </span>
                  </td>

                  {/* Days Since Filing */}
                  <td className="px-4 py-3 font-bold text-gray-dark">
                    {lead.days_since_filing}
                  </td>

                  {/* Estimated Equity */}
                  <td className={`px-4 py-3 font-medium ${equity != null && equity > 200000 ? 'text-green' : 'text-gray-dark'}`}>
                    {formatEquity(equity)}
                  </td>

                  {/* Enrichment Status */}
                  <td className="px-4 py-3">
                    {isEnriched ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-light px-2.5 py-0.5 text-xs font-medium text-teal">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Enriched
                      </span>
                    ) : null}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <Link
                      to={`/leads/${lead.id}`}
                      className="rounded bg-teal px-3 py-1 text-xs font-medium text-white hover:bg-teal/90 transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-mid">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded border border-gray-light px-3 py-1.5 text-sm text-gray-dark hover:bg-bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded border border-gray-light px-3 py-1.5 text-sm text-gray-dark hover:bg-bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
