import { Link, useParams } from 'react-router-dom'
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
    <div className="flex items-start justify-between border-b border-gray-light py-2.5 last:border-0 hover:bg-bg-secondary/50 transition-colors duration-100 px-1 -mx-1 rounded">
      <span className="text-sm text-gray-mid">{label}</span>
      <span className="text-right text-sm font-medium text-gray-dark">{value}</span>
    </div>
  )
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-mid">
      {icon}
      {title}
    </h3>
  )
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: lead, isLoading, error } = useLeadDetail(id ?? '')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-secondary bg-pattern">
        <header className="glass-header sticky top-0 z-30 px-6 py-3.5">
          <div className="mx-auto max-w-7xl flex items-center gap-2">
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
      <div className="min-h-screen bg-bg-secondary bg-pattern">
        <header className="glass-header sticky top-0 z-30 px-6 py-3.5">
          <div className="mx-auto max-w-7xl flex items-center gap-2">
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
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">
          <Link
            to="/"
            className="group mb-6 inline-flex items-center gap-1.5 text-sm text-teal hover:underline"
          >
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
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
    <div className="min-h-screen bg-bg-secondary bg-pattern">
      {/* Header */}
      <header className="bg-bg-primary px-6 py-4 shadow-[0_1px_3px_0_rgba(13,33,55,0.08)]">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <svg className="h-7 w-7 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v10l4.5 4.5" />
              <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
            </svg>
            <h1 className="text-xl font-bold text-navy">Seller Quest</h1>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-gray-light/50 bg-bg-secondary/80 px-3.5 py-1.5 text-xs font-medium text-gray-mid"><span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />Lead Detail</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Back link */}
        <Link
          to="/"
          className="group mb-6 inline-flex items-center gap-1.5 text-sm text-teal hover:underline"
        >
          <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Two-column layout */}
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-5 animate-fade-in">
          {/* Left Column (60%) — Property & Filing Details */}
          <div className="lg:col-span-3 space-y-5">
            {/* Property address header */}
            <div className="card p-5">
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
            <div className="card p-5">
              <SectionHeader
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                title="Filing Details"
              />
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
              <div className="card p-5">
                <SectionHeader
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  }
                  title="Property Details"
                />
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
            <div className="card p-5">
              <SectionHeader
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                }
                title="Contact Info"
              />
              <ContactInfo enrichment={enrichment} leadId={lead.id} />
            </div>

            {/* AI Summary */}
            <div className="card p-5">
              <SectionHeader
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                }
                title="AI Analysis"
              />
              <AISummaryCard leadId={lead.id} summary={lead.ai_summary} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
