import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/client.js'
import type { Lead } from './useLeads.js'

export function useLeadDetail(id: string) {
  return useQuery<Lead>({
    queryKey: ['lead', id],
    queryFn: () => apiFetch<Lead>(`/leads/${id}`),
    enabled: !!id,
  })
}
