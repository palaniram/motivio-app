import type { AiSummary } from '../hooks/useLeads.js'
import { useSummarize } from '../hooks/useSummarize.js'

interface AISummaryCardProps {
  leadId: string
  summary: AiSummary | null
}

export default function AISummaryCard({ leadId, summary }: AISummaryCardProps) {
  const { summarize, isLoading, data, error } = useSummarize(leadId)

  // Determine which summary to display: fresh mutation result, or cached from props
  const freshSummary = data?.summary ?? null
  const isCached = summary != null && freshSummary == null
  const displaySummary = freshSummary ?? summary?.summary ?? null

  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-lg border-l-4 border-teal bg-teal-light p-4">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 animate-spin text-teal"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm text-gray-mid">Analyzing lead...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !displaySummary) {
    return (
      <div className="rounded-lg border border-red/20 bg-red/5 p-4">
        <p className="text-sm text-red">Summary unavailable</p>
        <button
          onClick={() => summarize()}
          className="mt-1 text-sm font-medium text-teal hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  // Summary exists (cached or fresh)
  if (displaySummary) {
    return (
      <div className="rounded-lg border-l-4 border-teal bg-teal-light p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-navy">AI Summary</h3>
          <div className="flex items-center gap-3">
            {isCached && (
              <span className="rounded bg-gray-light px-2 py-0.5 text-xs text-gray-mid">
                Cached
              </span>
            )}
            <button
              onClick={() => summarize()}
              className="text-xs text-teal hover:underline"
            >
              Regenerate
            </button>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-gray-dark">{displaySummary}</p>
      </div>
    )
  }

  // Default state: no summary yet
  return (
    <div className="rounded-lg border border-gray-light bg-bg-secondary p-4">
      <button
        onClick={() => summarize()}
        className="w-full rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal/90"
      >
        Summarize this lead
      </button>
    </div>
  )
}
