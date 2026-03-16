// Hook for triggering AI lead summarization
export function useSummarize() {
  return { summarize: async (_id: string) => {}, isLoading: false, summary: null }
}
