import { useQuery } from '@tanstack/react-query'
import { apiFetch, buildQueryString } from '../api/client.js'
import type { LeadFilters } from '../hooks/useLeads.js'

interface Stats {
  total: number
  byCounty: Record<string, number>
  byLeadType: Record<string, number>
  enrichedCount: number
  avgDaysSinceFiling: number
  filedLast7Days: number
  filedLast30Days: number
}

interface StatsBarProps {
  filters: LeadFilters
}

const CARD_CONFIG = [
  {
    label: 'Total Leads',
    key: 'total' as const,
    accent: 'bg-teal',
    iconBg: 'bg-teal/10 text-teal',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    label: 'Filed Last 7 Days',
    key: 'filedLast7Days' as const,
    accent: 'bg-navy',
    iconBg: 'bg-navy/10 text-navy',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    label: 'Enriched Leads',
    key: 'enrichedCount' as const,
    accent: 'bg-green',
    iconBg: 'bg-green/10 text-green',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Avg Days Since Filing',
    key: 'avgDaysSinceFiling' as const,
    accent: 'bg-gold',
    iconBg: 'bg-gold/10 text-gold',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
]

export default function StatsBar({ filters }: StatsBarProps) {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['leads-stats', filters],
    queryFn: () => {
      const qs = buildQueryString({
        county: filters.county,
        leadType: filters.leadType,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        minEquity: filters.minEquity,
        enriched: filters.enriched,
      })
      return apiFetch<Stats>(`/leads/stats${qs}`)
    },
  })

  const values: Record<string, number> = {
    total: stats?.total ?? 0,
    filedLast7Days: stats?.filedLast7Days ?? 0,
    enrichedCount: stats?.enrichedCount ?? 0,
    avgDaysSinceFiling: stats?.avgDaysSinceFiling != null ? Math.round(stats.avgDaysSinceFiling) : 0,
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {CARD_CONFIG.map((card, idx) => (
        <div
          key={card.label}
          className="card card-interactive relative overflow-hidden px-5 py-5"
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          {/* Colored accent strip */}
          <div className={`absolute top-0 left-0 right-0 h-0.5 ${card.accent}`} />
          {/* Subtle corner gradient glow */}
          <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-[0.04] ${card.accent}`} />

          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-mid">{card.label}</p>
              {isLoading ? (
                <div className="mt-3 h-8 w-20 skeleton rounded" />
              ) : (
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-navy">
                  {values[card.key].toLocaleString()}
                </p>
              )}
            </div>
            <div className={`rounded-xl p-2.5 ${card.iconBg}`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
