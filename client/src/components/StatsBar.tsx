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

  const cards = [
    { label: 'Total Leads', value: stats?.total ?? 0 },
    { label: 'Filed Last 7 Days', value: stats?.filedLast7Days ?? 0 },
    { label: 'Enriched Leads', value: stats?.enrichedCount ?? 0 },
    {
      label: 'Avg Days Since Filing',
      value: stats?.avgDaysSinceFiling != null ? Math.round(stats.avgDaysSinceFiling) : 0,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-gray-light bg-bg-primary px-5 py-4 shadow-sm"
        >
          <p className="text-sm font-medium text-gray-mid">{card.label}</p>
          <p className={`mt-1 text-2xl font-bold text-navy ${isLoading ? 'animate-pulse' : ''}`}>
            {isLoading ? '--' : card.value.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}
