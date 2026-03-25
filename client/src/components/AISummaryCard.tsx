import type { AiSummary } from '../hooks/useLeads.js'
import { useSummarize } from '../hooks/useSummarize.js'

interface AISummaryCardProps {
  leadId: string
  summary: AiSummary | null
}

export default function AISummaryCard({ leadId, summary }: AISummaryCardProps) {
  const { summarize, isLoading, data, error } = useSummarize(leadId)

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
        {/* Shimmer skeleton lines */}
        <div className="mt-3 space-y-2">
          <div className="h-3.5 w-full skeleton rounded" />
          <div className="h-3.5 w-4/5 skeleton rounded" />
          <div className="h-3.5 w-3/5 skeleton rounded" />
        </div>
      </div>
    )
  }

  // Error state
  if (error && !displaySummary) {
    return (
      <div className="rounded-lg border border-red/20 bg-red/5 p-4">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-red">Summary unavailable</p>
        </div>
        <button
          onClick={() => summarize()}
          className="mt-2 text-sm font-medium text-teal hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  // Summary exists (cached or fresh)
  if (displaySummary) {
    return (
      <div className="rounded-lg border-l-4 border-teal bg-teal-light p-4 animate-fade-in">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-navy">
            <svg className="h-4 w-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            AI Summary
          </h3>
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
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal to-teal/80 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-150"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        Summarize this lead
      </button>
    </div>
  )
}
