import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api/client.js'

interface EnrichResponse {
  enrichment: any
  cached: boolean
}

export function useEnrich(leadId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation<EnrichResponse, Error>({
    mutationFn: () =>
      apiFetch<EnrichResponse>(`/leads/${leadId}/enrich`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
    },
  })

  return {
    enrich: mutation.mutate,
    isLoading: mutation.isPending,
    data: mutation.data ?? null,
    error: mutation.error,
  }
}
