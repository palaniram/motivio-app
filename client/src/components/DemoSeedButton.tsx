import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api/client.js'

export default function DemoSeedButton() {
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  async function handleSeed() {
    if (!window.confirm('This will replace all demo data with a fresh batch. Continue?')) {
      return
    }

    setLoading(true)
    try {
      const result = await apiFetch<{ seeded: number; enriched: number }>('/demo/seed', {
        method: 'POST',
      })
      queryClient.invalidateQueries()
      alert(`Seeded ${result.seeded} leads (${result.enriched} enriched)`)
    } catch {
      alert('Failed to seed demo data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSeed}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-md border border-teal px-3 py-1.5 text-sm font-medium text-teal shadow-sm hover:shadow hover:bg-teal/5 active:scale-[0.98] disabled:opacity-50 transition-all duration-150"
    >
      {loading ? (
        <span className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Seeding...
        </span>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Generate Demo Data
        </>
      )}
    </button>
  )
}
