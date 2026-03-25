import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api/client.js'

type ImportResult = { imported: number; duplicates: number; errors: string[] }

export default function DataToolbar() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [seeding, setSeeding] = useState(false)
  const [importing, setImporting] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [county, setCounty] = useState('Alameda')
  const [leadType, setLeadType] = useState('NOD')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleSeed() {
    if (!window.confirm('This will replace all demo data with a fresh batch. Continue?')) return
    setSeeding(true)
    setResult(null)
    try {
      const res = await apiFetch<{ seeded: number; enriched: number }>('/demo/seed', { method: 'POST' })
      queryClient.invalidateQueries()
      setResult({ type: 'success', message: `Seeded ${res.seeded} leads (${res.enriched} enriched)` })
    } catch {
      setResult({ type: 'error', message: 'Failed to seed demo data' })
    } finally {
      setSeeding(false)
    }
  }

  async function handleImport() {
    if (!file) return
    setImporting(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('county', county)
      formData.append('leadType', leadType)

      const res = await fetch('/api/import/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Import failed' }))
        throw new Error(err.error || 'Import failed')
      }
      const data: ImportResult = await res.json()
      queryClient.invalidateQueries()
      const parts = [`Imported ${data.imported} leads`]
      if (data.duplicates > 0) parts.push(`${data.duplicates} duplicates skipped`)
      if (data.errors.length > 0) parts.push(`${data.errors.length} errors`)
      setResult({ type: data.errors.length > 0 ? 'error' : 'success', message: parts.join(', ') })
      setFile(null)
      setShowImport(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setResult({ type: 'error', message: err instanceof Error ? err.message : 'Import failed' })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {/* Generate Demo Data */}
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal/25 bg-teal/5 px-3.5 py-2 text-xs font-semibold text-teal hover:bg-teal/10 hover:border-teal/40 active:scale-[0.98] disabled:opacity-50 transition-all duration-150"
        >
          {seeding ? (
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Seeding...
            </span>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Demo Data
            </>
          )}
        </button>

        {/* Import CSV toggle */}
        <button
          onClick={() => { setShowImport(!showImport); setResult(null) }}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold active:scale-[0.98] transition-all duration-150 ${
            showImport
              ? 'border-teal bg-gradient-to-b from-teal to-teal-dark text-white shadow-[0_2px_6px_rgba(11,122,117,0.25)]'
              : 'border-navy/20 bg-navy/5 text-navy hover:bg-navy/10 hover:border-navy/30'
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import CSV
        </button>
      </div>

      {/* Import panel */}
      {showImport && (
        <div className="card p-5 animate-slide-up">
          <div className="flex flex-wrap items-end gap-4">
            {/* File picker */}
            <div className="flex-1 min-w-[200px]">
              <label className="mb-2 block text-[0.65rem] font-bold uppercase tracking-widest text-gray-mid">
                CSV File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-gray-dark file:mr-3 file:rounded-lg file:border file:border-gray-light/70 file:bg-bg-secondary/50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gray-dark file:cursor-pointer hover:file:bg-gray-light/40 file:transition-colors"
              />
            </div>

            {/* County */}
            <div>
              <label className="mb-2 block text-[0.65rem] font-bold uppercase tracking-widest text-gray-mid">
                County
              </label>
              <div className="relative">
                <select
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="appearance-none rounded-lg border border-gray-light/70 bg-bg-secondary/30 pl-2.5 pr-7 py-1.5 text-xs text-gray-dark transition-all"
                >
                  <option value="Alameda">Alameda</option>
                  <option value="Contra Costa">Contra Costa</option>
                  <option value="San Mateo">San Mateo</option>
                </select>
                <svg className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Lead Type */}
            <div>
              <label className="mb-2 block text-[0.65rem] font-bold uppercase tracking-widest text-gray-mid">
                Lead Type
              </label>
              <div className="relative">
                <select
                  value={leadType}
                  onChange={(e) => setLeadType(e.target.value)}
                  className="appearance-none rounded-lg border border-gray-light/70 bg-bg-secondary/30 pl-2.5 pr-7 py-1.5 text-xs text-gray-dark transition-all"
                >
                  <option value="NOD">NOD</option>
                  <option value="tax_delinquent">Tax Delinquent</option>
                </select>
                <svg className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Import button */}
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-navy to-navy-light px-4 py-1.5 text-xs font-semibold text-white shadow-[0_2px_6px_rgba(13,33,55,0.25)] hover:shadow-[0_4px_10px_rgba(13,33,55,0.3)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              {importing ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Importing...
                </>
              ) : (
                'Upload'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Result toast */}
      {result && (
        <div className={`card px-4 py-3 text-xs font-medium animate-fade-in ${
          result.type === 'success'
            ? 'border-green/20 bg-green/5 text-green'
            : 'border-red/20 bg-red/5 text-red'
        }`}>
          {result.message}
        </div>
      )}
    </div>
  )
}
