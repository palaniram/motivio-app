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
      // Fallback for non-secure contexts
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

  return (
    <div className="flex items-center justify-between rounded-md border border-gray-light bg-bg-primary px-3 py-2">
      <div>
        <p className="text-xs text-gray-mid">{label}</p>
        <p className="text-sm font-medium text-gray-dark">{value}</p>
      </div>
      <button
        onClick={handleCopy}
        className="ml-3 shrink-0 rounded px-2 py-1 text-xs font-medium text-teal transition-colors hover:bg-teal-light"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

export default function ContactInfo({ enrichment, leadId }: ContactInfoProps) {
  const { enrich, isLoading } = useEnrich(leadId)

  if (!enrichment) {
    return (
      <div className="rounded-lg border border-gray-light bg-bg-secondary p-4">
        <p className="text-sm text-gray-mid">No contact info yet</p>
        <button
          onClick={() => enrich()}
          disabled={isLoading}
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal/90 disabled:opacity-50"
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
      <div className="rounded-lg border border-gray-light bg-bg-secondary p-4">
        <p className="text-sm text-gray-mid">No contact info available</p>
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
