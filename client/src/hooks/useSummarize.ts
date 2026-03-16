import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api/client.js'

interface SummarizeResponse {
  summary: string
  cached: boolean
}

export function useSummarize(leadId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation<SummarizeResponse, Error>({
    mutationFn: () =>
      apiFetch<SummarizeResponse>(`/leads/${leadId}/summarize`, {
        method: 'POST',
      }),
    onSuccess: () => {
      // Invalidate the lead detail query so cached summary appears
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
    },
  })

  return {
    summarize: mutation.mutate,
    isLoading: mutation.isPending,
    data: mutation.data ?? null,
    error: mutation.error,
  }
}
