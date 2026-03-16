import { useParams, Link } from 'react-router-dom'
import { useLeadDetail } from '../hooks/useLeadDetail.js'
import ContactInfo from '../components/ContactInfo.js'
import AISummaryCard from '../components/AISummaryCard.js'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'N/A'
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}k`
  }
  return `$${value.toLocaleString()}`
}

function formatCurrencyFull(value: number | null | undefined): string {
  if (value == null) return 'N/A'
  return `$${value.toLocaleString()}`
}

function UrgencyBadge({ days }: { days: number | null }) {
  if (days == null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-light px-3 py-1 text-xs font-medium text-gray-mid">
        <span className="h-2 w-2 rounded-full bg-gray-mid" />
        Unknown
      </span>
    )
  }

  let colorClass: string
  let dotClass: string
  if (days <= 30) {
    colorClass = 'bg-red/10 text-red'
    dotClass = 'bg-red'
  } else if (days <= 60) {
    colorClass = 'bg-gold/10 text-gold'
    dotClass = 'bg-gold'
  } else {
    colorClass = 'bg-gray-light text-gray-mid'
    dotClass = 'bg-gray-mid'
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${colorClass}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {days} days since filing
    </span>
  )
}

function LeadTypePill({ type }: { type: string }) {
  const label = type === 'NOD' ? 'NOD' : 'Tax Delinquent'
  return (
    <span className="inline-block rounded-full bg-navy/10 px-3 py-1 text-xs font-medium text-navy">
      {label}
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === 'N/A') return null
  return (
    <div className="flex items-start justify-between border-b border-gray-light py-2.5 last:border-0">
      <span className="text-sm text-gray-mid">{label}</span>
      <span className="text-right text-sm font-medium text-gray-dark">{value}</span>
    </div>
  )
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: lead, isLoading, error } = useLeadDetail(id ?? '')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <header className="border-b border-gray-light bg-bg-primary px-6 py-4">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-xl font-bold text-navy">MotivIO</h1>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal border-t-transparent" />
            <span className="text-sm text-gray-mid">Loading lead details...</span>
          </div>
        </main>
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <header className="border-b border-gray-light bg-bg-primary px-6 py-4">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-xl font-bold text-navy">MotivIO</h1>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1 text-sm text-teal hover:underline"
          >
            &larr; Back to Dashboard
          </Link>
          <div className="mt-4 rounded-lg border border-red/20 bg-red/5 px-4 py-3 text-sm text-red">
            {error ? 'Failed to load lead details.' : 'Lead not found.'}
          </div>
        </main>
      </div>
    )
  }

  const enrichment = lead.enrichment
  const equityIsHigh =
    enrichment?.estimated_equity != null && enrichment.estimated_equity > 200000

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Header */}
      <header className="border-b border-gray-light bg-bg-primary px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <h1 className="text-xl font-bold text-navy">MotivIO</h1>
          <span className="text-sm text-gray-mid">Lead Detail</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Back link */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-teal hover:underline"
        >
          &larr; Back to Dashboard
        </Link>

        {/* Two-column layout */}
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left Column (60%) — Property & Filing Details */}
          <div className="lg:col-span-3 space-y-5">
            {/* Property address header */}
            <div className="rounded-lg border border-gray-light bg-bg-primary p-5">
              <h2 className="text-xl font-bold text-navy">
                {lead.property_address}
              </h2>
              {(lead.city || lead.zip) && (
                <p className="mt-0.5 text-sm text-gray-mid">
                  {[lead.city, lead.zip].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <UrgencyBadge days={lead.days_since_filing} />
                <LeadTypePill type={lead.lead_type} />
              </div>
            </div>

            {/* Filing details */}
            <div className="rounded-lg border border-gray-light bg-bg-primary p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-mid">
                Filing Details
              </h3>
              <DetailRow label="Filing Date" value={formatDate(lead.filing_date)} />
              <DetailRow label="County" value={lead.county} />
              <DetailRow label="Owner" value={lead.owner_name} />
              <DetailRow
                label="Loan Amount in Default"
                value={lead.loan_amount != null ? formatCurrencyFull(lead.loan_amount) : null}
              />
              <DetailRow label="Trustee" value={lead.trustee_name} />
            </div>

            {/* Enrichment: Property Details */}
            {enrichment && (
              <div className="rounded-lg border border-gray-light bg-bg-primary p-5">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-mid">
                  Property Details
                </h3>
                <DetailRow
                  label="Estimated Value"
                  value={
                    enrichment.estimated_value != null
                      ? formatCurrencyFull(enrichment.estimated_value)
                      : null
                  }
                />
                <DetailRow
                  label="Estimated Equity"
                  value={
                    enrichment.estimated_equity != null ? (
                      <span className={equityIsHigh ? 'text-green font-semibold' : ''}>
                        {formatCurrencyFull(enrichment.estimated_equity)}
                      </span>
                    ) : null
                  }
                />
                <DetailRow label="Property Type" value={enrichment.property_type} />
                <DetailRow
                  label="Beds / Baths"
                  value={
                    enrichment.bedrooms != null || enrichment.bathrooms != null
                      ? `${enrichment.bedrooms ?? '?'}bd / ${enrichment.bathrooms ?? '?'}ba`
                      : null
                  }
                />
                <DetailRow
                  label="Square Feet"
                  value={enrichment.sq_ft != null ? enrichment.sq_ft.toLocaleString() : null}
                />
                <DetailRow
                  label="Year Built"
                  value={enrichment.year_built != null ? String(enrichment.year_built) : null}
                />
                <DetailRow
                  label="Last Sale Date"
                  value={enrichment.last_sale_date ? formatDate(enrichment.last_sale_date) : null}
                />
                <DetailRow
                  label="Last Sale Price"
                  value={
                    enrichment.last_sale_price != null
                      ? formatCurrencyFull(enrichment.last_sale_price)
                      : null
                  }
                />
              </div>
            )}
          </div>

          {/* Right Column (40%) — Contact Info + AI Summary */}
          <div className="lg:col-span-2 space-y-5">
            {/* Contact Info */}
            <div className="rounded-lg border border-gray-light bg-bg-primary p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-mid">
                Contact Info
              </h3>
              <ContactInfo enrichment={enrichment} />
            </div>

            {/* AI Summary */}
            <div className="rounded-lg border border-gray-light bg-bg-primary p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-mid">
                AI Analysis
              </h3>
              <AISummaryCard leadId={lead.id} summary={lead.ai_summary} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
