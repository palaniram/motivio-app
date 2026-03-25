import { useState } from 'react'
import type { Enrichment } from '../hooks/useLeads.js'
import { useEnrich } from '../hooks/useEnrich.js'

interface ContactInfoProps {
  enrichment: Enrichment | null
  leadId: string
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = value
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isPhone = label.toLowerCase().includes('phone')

  return (
    <div className="flex items-center justify-between rounded-md border border-gray-light bg-bg-primary px-3 py-2 hover:border-teal/30 hover:shadow-sm transition-all">
      <div className="flex items-center gap-2.5">
        {isPhone ? (
          <svg className="h-4 w-4 text-gray-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        ) : (
          <svg className="h-4 w-4 text-gray-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )}
        <div>
          <p className="text-xs text-gray-mid">{label}</p>
          <p className="text-sm font-medium text-gray-dark">{value}</p>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="ml-3 shrink-0 rounded px-2 py-1 text-xs font-medium text-teal transition-colors hover:bg-teal-light"
      >
        {copied ? (
          <span className="inline-flex items-center gap-1 text-green">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Copied
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copy
          </span>
        )}
      </button>
    </div>
  )
}

export default function ContactInfo({ enrichment, leadId }: ContactInfoProps) {
  const { enrich, isLoading } = useEnrich(leadId)

  if (!enrichment) {
    return (
      <div className="rounded-lg border border-gray-light bg-bg-secondary p-6 text-center">
        <svg className="mx-auto h-10 w-10 text-gray-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="mt-3 text-sm text-gray-mid">No contact info yet</p>
        <button
          onClick={() => enrich()}
          disabled={isLoading}
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-teal to-teal/85 px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Enriching...
            </>
          ) : (
            'Enrich this lead'
          )}
        </button>
      </div>
    )
  }

  const phones = [enrichment.phone_1, enrichment.phone_2, enrichment.phone_3].filter(
    Boolean
  ) as string[]
  const emails = [enrichment.email_1, enrichment.email_2].filter(Boolean) as string[]
  const mailingAddress = enrichment.mailing_address

  const hasAnyContact = phones.length > 0 || emails.length > 0 || mailingAddress

  if (!hasAnyContact) {
    return (
      <div className="rounded-lg border border-gray-light bg-bg-secondary p-6 text-center">
        <svg className="mx-auto h-10 w-10 text-gray-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="mt-3 text-sm text-gray-mid">No contact info available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {phones.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-mid">
            Phone
          </h3>
          <div className="space-y-2">
            {phones.map((phone, i) => (
              <CopyButton key={i} value={phone} label={`Phone ${i + 1}`} />
            ))}
          </div>
        </div>
      )}

      {emails.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-mid">
            Email
          </h3>
          <div className="space-y-2">
            {emails.map((email, i) => (
              <CopyButton key={i} value={email} label={`Email ${i + 1}`} />
            ))}
          </div>
        </div>
      )}

      {mailingAddress && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-mid">
            Mailing Address
          </h3>
          <CopyButton value={mailingAddress} label="Mailing address (different from property)" />
        </div>
      )}
    </div>
  )
}
