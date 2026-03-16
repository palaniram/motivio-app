# MotivIO — CLAUDE.md
# Motivated Seller Data Sourcing for Bay Area Investors

---

## What This Is

MotivIO is a micro SaaS product that gives Bay Area real estate investors
a clean, enriched, ready-to-work motivated seller list in 10 minutes.
No PropStream expertise required. No vendor dependency. No setup calls.

The core promise: sign up → select county → get an enriched list of
motivated sellers sorted by urgency → export CSV → done.

This document is the single source of truth for every build decision.
Read it fully before writing any code.

---

## The Demo Moment We Are Building Toward

A Bay Area investor opens the dashboard. They filter to Alameda County,
NOD filings, last 30 days. 40–50 records appear sorted by days since
filing — most urgent first, color-coded red/amber/gray. They click one
record. They see: owner name, property address, filing date, days since
filing, estimated equity, phone numbers, email address. They click
"Summarize this lead." In 2 seconds Claude returns a 3-sentence
plain-English interpretation of the opportunity. They click Export.
A clean CSV downloads with all visible records.

That sequence — filter, view, summarize, export — is the entire product.
Everything we build serves that sequence and nothing else.

---

## MVP Scope — Build Exactly This

### Core Features (Phase 1)
1. CSV import pipeline — manual upload of county-format CSVs
2. Data normalization — Alameda, Contra Costa, San Mateo county formats
3. Deduplication — on property_address + filing_date
4. Dashboard — filterable leads table with urgency indicators
5. Record detail view — all fields + enrichment status
6. PropertyRadar data integration — automated daily pull (see Data below)
7. CSV export — current filtered view as downloadable CSV
8. Auth — email/password login via Clerk
9. Billing — $79/month Stripe subscription with 7-day free trial

### AI Feature (Phase 1 + AI)
10. Lead summarization — single Claude API call per record view
    Generates a 2–3 sentence plain-English interpretation of the lead

### Explicitly Out of Scope for This Build
- Outreach message drafting (Phase 3)
- Lead scoring / ranking (Phase 4)
- Natural language filtering (Phase 5)
- GoHighLevel / CRM integration (Phase 3)
- Automated SMS / email sequences (Phase 2)
- Multi-tenant team accounts (future)
- Mobile app (future)
- Any lead source other than NOD and tax-delinquent (Phase 2)

---

## Target Customer

Bay Area real estate investor doing 1–5 deals per month who:
- Is currently paying a vendor $1,000–$3,000/month for motivated seller
  lists and unhappy with quality, OR
- Tried PropStream, found it too complex, gave up, went back to a vendor
- Is NOT a data expert and does NOT want to become one
- Wants the list — not the platform

They work Alameda, Contra Costa, and/or San Mateo counties.

---

## Data Strategy

### Phase 1 MVP — Manual CSV Import
Seed the database with a manual one-time Propwire export for all three
counties. Propwire allows up to 10,000 free exports per day with
pre-foreclosure and tax-delinquent filters built in.

Steps to get seed data:
1. Go to propwire.com — create free account
2. Filter: pre-foreclosure, Alameda County, last 60 days — export CSV
3. Repeat for Contra Costa and San Mateo
4. Import all three CSVs via the admin import endpoint

This gives us 200–400 real Bay Area records to demo with at zero cost.
Manual refresh weekly while validating the product with first customers.

### Phase 2 — PropertyRadar API (automated)
Once 3–5 paying customers validate the model, automate data sourcing
via PropertyRadar API (developers.propertyradar.com).

PropertyRadar covers:
- NOD filings with daily updates for all California counties
- Tax-delinquent owners
- Phone and email already appended — no separate skip tracing needed
- DNC scrubbing built in
- Webhook support for new filing notifications

Scheduled job: daily at 6:00 AM PST
- Call PropertyRadar API filtered to Alameda, Contra Costa, San Mateo
- Lead types: NOD + tax-delinquent
- Records filed in last 24 hours
- Normalize response → leads schema
- Deduplicate against existing records
- New filings land in database automatically

The CSV import pipeline stays as a fallback. The architecture must
support both sources without schema changes — just swap the DataSource
adapter.

### Data Source Abstraction (critical architecture requirement)
Build a clean source abstraction from day one:

```
DataSource (interface/abstract)
  ├── CSVImporter          — manual upload (MVP)
  └── PropertyRadarSource  — automated daily pull (Phase 2)

Normalizer
  └── Maps any source format → LeadRecord schema

Deduplicator
  └── property_address + filing_date uniqueness check

Scheduler
  └── Cron job triggers PropertyRadarSource daily at 6 AM PST
```

The dashboard, enrichment, export — none of these should care where
the data came from. Source is stored on each record for audit trail.

---

## Database Schema

### leads table
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
county            TEXT NOT NULL  -- 'Alameda' | 'Contra Costa' | 'San Mateo'
lead_type         TEXT NOT NULL  -- 'NOD' | 'tax_delinquent'
owner_name        TEXT
property_address  TEXT NOT NULL
city              TEXT
zip               TEXT
filing_date       DATE
loan_amount       NUMERIC
trustee_name      TEXT
source            TEXT           -- 'csv_import' | 'propertyradar' | 'propwire'
source_file       TEXT           -- CSV filename if manually imported
external_id       TEXT           -- PropertyRadar record ID if applicable
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()

-- days_since_filing is ALWAYS computed at query time from filing_date
-- never stored — it changes every day
```

### enrichment table
```sql
id                          UUID PRIMARY KEY DEFAULT gen_random_uuid()
lead_id                     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE
phone_1                     TEXT
phone_2                     TEXT
phone_3                     TEXT
email_1                     TEXT
email_2                     TEXT
mailing_address             TEXT  -- owner mailing if different from property
estimated_value             NUMERIC
estimated_equity            NUMERIC
property_type               TEXT  -- 'SFR' | 'Condo' | 'Multi-family' | 'Land'
bedrooms                    INTEGER
bathrooms                   NUMERIC
sq_ft                       INTEGER
year_built                  INTEGER
last_sale_date              DATE
last_sale_price             NUMERIC
enrichment_source           TEXT  -- 'propertyradar' | 'batch_skip_tracing'
raw_response                JSONB -- store full API response, never re-pay
enriched_at                 TIMESTAMPTZ DEFAULT NOW()
```

### ai_summaries table
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
lead_id       UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE
summary       TEXT NOT NULL
model         TEXT NOT NULL  -- 'claude-sonnet-4-20250514'
prompt_tokens INTEGER
output_tokens INTEGER
created_at    TIMESTAMPTZ DEFAULT NOW()

-- One summary per lead. If regenerated, upsert on lead_id.
-- Cache summaries — never call Claude twice for the same record
-- unless explicitly regenerated by user.
```

### users table (managed by Clerk, minimal local mirror)
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
clerk_id      TEXT UNIQUE NOT NULL
email         TEXT NOT NULL
stripe_customer_id    TEXT
subscription_status   TEXT  -- 'trialing' | 'active' | 'cancelled' | 'past_due'
subscription_id       TEXT
trial_ends_at         TIMESTAMPTZ
created_at            TIMESTAMPTZ DEFAULT NOW()
```

---

## API Endpoints

### Leads
```
GET  /api/leads
     Query params: county, leadType, dateFrom, dateTo,
                   minEquity, propertyType, enriched (bool),
                   sort (default: days_since_filing ASC),
                   page, limit (default 50)
     Returns: { leads: LeadRecord[], total: number, page: number }

GET  /api/leads/:id
     Returns: single lead with enrichment joined, summary if cached

GET  /api/leads/stats
     Returns: { total, byCounty, byLeadType, enrichedCount,
                avgDaysSinceFiling, filedLast7Days, filedLast30Days }
```

### Import
```
POST /api/import/csv
     Multipart form: file (CSV), county (required), leadType (required)
     Returns: { imported: number, duplicates: number, errors: string[] }
     Auth: admin only (protect with ADMIN_SECRET env var)
```

### Export
```
GET  /api/export/csv
     Same query params as GET /api/leads
     Returns: CSV file download, Content-Disposition: attachment
     Includes all fields flattened including enrichment
```

### AI Summarization
```
POST /api/leads/:id/summarize
     Body: {} (empty — all context pulled from lead + enrichment)
     Returns: { summary: string, cached: boolean }
     Behavior:
       - Check ai_summaries table first — return cached if exists
       - If no cache: call Claude API, store result, return summary
       - Never call Claude twice for the same lead_id
       - Rate limit: max 20 summarize calls per user per day
```

### Auth (Clerk webhooks)
```
POST /api/webhooks/clerk
     Handles: user.created, user.deleted
     Creates/removes local user record

POST /api/webhooks/stripe
     Handles: checkout.session.completed,
              customer.subscription.updated,
              customer.subscription.deleted,
              invoice.payment_failed
     Updates subscription_status on user record
```

### Health
```
GET  /health
     Returns: { status: 'ok', timestamp: string }
     No auth required — Railway health check endpoint
```

---

## Lead Summarization — AI Feature Specification

### What It Does
When an investor views a record detail page and clicks "Summarize this
lead", the system calls Claude API with structured lead context and
returns a 2–3 sentence plain-English interpretation of the opportunity.

### When to Call Claude
- Only on explicit user click — never auto-generate on page load
- Check ai_summaries table first — return cache if exists
- If no cache: call Claude, store result, display
- Cached summaries display instantly with a "Cached" indicator
- User can click "Regenerate" to force a fresh summary (counts toward
  daily limit)

### The Claude API Call

Model: claude-sonnet-4-20250514
Max tokens: 200 (summaries must be brief)
Temperature: not set (use default)

System prompt:
```
You are a real estate investment analyst helping Bay Area investors
quickly evaluate distressed seller leads. You receive structured data
about a pre-foreclosure or tax-delinquent property and write a concise
2–3 sentence summary that tells the investor:
1. The urgency of the situation (days since filing, timeline pressure)
2. The financial opportunity (estimated equity, property value)
3. One sentence on what makes this lead worth calling or skipping

Write in plain English. Be specific — use actual numbers from the data.
Never use jargon the investor wouldn't use themselves.
Do not make up information not present in the data.
If a field is missing, work with what you have — do not mention gaps.
Output only the summary text — no labels, no bullets, no formatting.
```

User message (constructed from lead + enrichment data):
```
Lead type: {lead_type}
County: {county}
Property: {property_address}, {city} {zip}
Owner: {owner_name}
Filing date: {filing_date} ({days_since_filing} days ago)
Loan amount in default: ${loan_amount}
Trustee: {trustee_name}
Estimated property value: ${estimated_value}
Estimated equity: ${estimated_equity}
Property type: {property_type}
Bedrooms/Bathrooms: {bedrooms}bd / {bathrooms}ba
Last sale: ${last_sale_price} on {last_sale_date}
Contact info available: {has_phone} phone, {has_email} email
```

### Cost Control
- Store every summary — never pay twice for the same record
- 20 summarize calls/user/day rate limit
- Log prompt_tokens and output_tokens on every call
- At ~150 tokens average per call: ~$0.0004/summary (negligible)

### Error Handling
- If Claude API fails: show "Summary unavailable — try again" toast
- Never block the record view — summary is additive, not required
- Timeout after 10 seconds — show error state if exceeded

---

## Dashboard — UI Specification

### Leads Table Columns (in order)
1. Urgency badge — color dot only: red (0–30 days), amber (31–60),
   gray (61+). No text label.
2. Owner Name
3. Property Address
4. County
5. Lead Type — "NOD" or "Tax Delinquent" pill
6. Days Since Filing — number, bold
7. Estimated Equity — "$340k" format, green if >$200k
8. Enrichment status — "✓ Enriched" teal badge or "Enrich" button
9. Actions — "View" button

### Filter Bar (above table)
- County: multi-select checkboxes (Alameda, Contra Costa, San Mateo)
- Lead Type: multi-select (NOD, Tax Delinquent)
- Filing Date: date range picker — default: last 60 days
- Equity: minimum slider ($0 to $500k+)
- Enrichment: All | Enriched only | Not enriched
- Sort: Days Since Filing (default) | Filing Date | Estimated Equity

### Filter behavior
- Filters apply immediately on change — no submit button
- Filter state persists in URL query params (shareable, refreshable)
- Record count shown: "47 leads" above table

### Urgency color coding
- 0–30 days since filing: red (#9B2335)
- 31–60 days: amber (#C8902A)
- 61+ days: gray (#5A6A7A)

### Empty states
- No records after filter: "No leads match your filters. Try adjusting
  the date range or county selection."
- No records at all: "No leads imported yet. Import a CSV to get
  started." (admin only — regular users never see this)

### Stats bar (above filter bar)
Four stat cards in a row:
- Total leads (current filter)
- Filed last 7 days
- Enriched leads
- Average days since filing

---

## Record Detail View — UI Specification

### Layout
Two-column layout:
- Left column (60%): Property & Filing Details
- Right column (40%): Contact Info + AI Summary

### Left Column — Property & Filing Details
- Full property address (large, bold)
- Urgency badge with days since filing
- Filing date (formatted: "March 3, 2025")
- Lead type pill
- Loan amount in default
- Trustee name
- County

If enrichment exists:
- Estimated value
- Estimated equity (highlighted green if >$200k)
- Property type, beds, baths, sq ft, year built
- Last sale date and price

### Right Column — Contact Info
If enriched:
- Phone numbers (up to 3) — each with a "Copy" button
- Email addresses (up to 2) — each with a "Copy" button
- Mailing address if different from property

If not enriched:
- "No contact info yet" with an "Enrich this lead" button
- Clicking triggers the enrichment API call

### AI Summary Card (below contact info in right column)
States:
1. Default (no summary): "Summarize this lead" button — teal, prominent
2. Loading: spinner + "Analyzing lead..." text
3. Cached summary: summary text + small "Cached" gray badge +
   "Regenerate" text link
4. Fresh summary: summary text + no badge (newly generated)
5. Error: "Summary unavailable" + "Try again" link

Summary text styling:
- 14px, comfortable line height, readable gray (#2C3E50)
- Contained in a light teal card (#E6F4F3) with teal left border
- No bullets, no bold, just flowing prose

---

## Project Structure

```
motivio/
├── CLAUDE.md                    ← this file
├── .env.example
├── .env.local                   ← never commit
├── package.json                 ← npm workspaces
├── prisma/
│   └── schema.prisma
├── server/
│   ├── index.ts                 ← Express app entry, port 3001
│   ├── middleware/
│   │   ├── auth.ts              ← Clerk JWT verification
│   │   └── subscription.ts     ← gate routes on active subscription
│   ├── routes/
│   │   ├── leads.ts             ← GET /api/leads, GET /api/leads/:id
│   │   ├── import.ts            ← POST /api/import/csv
│   │   ├── export.ts            ← GET /api/export/csv
│   │   ├── summarize.ts         ← POST /api/leads/:id/summarize
│   │   └── webhooks.ts          ← POST /api/webhooks/clerk + /stripe
│   ├── services/
│   │   ├── sources/
│   │   │   ├── DataSource.ts    ← interface
│   │   │   ├── CSVImporter.ts   ← manual upload source
│   │   │   └── PropertyRadar.ts ← automated daily pull (Phase 2 stub)
│   │   ├── normalizer.ts        ← maps any source → LeadRecord schema
│   │   ├── deduplicator.ts      ← address + filing_date uniqueness
│   │   ├── enrichment.ts        ← PropertyRadar phone/email append
│   │   ├── summarizer.ts        ← Claude API call + cache logic
│   │   └── scheduler.ts         ← cron job for daily PropertyRadar pull
│   └── lib/
│       ├── prisma.ts            ← Prisma client singleton
│       ├── stripe.ts            ← Stripe client singleton
│       └── claude.ts            ← Anthropic client singleton
└── client/
    ├── index.html
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── pages/
        │   ├── Dashboard.tsx    ← leads table + filters + stats bar
        │   ├── LeadDetail.tsx   ← record detail + AI summary
        │   ├── Login.tsx        ← Clerk sign-in component
        │   └── Subscribe.tsx    ← Stripe checkout redirect
        ├── components/
        │   ├── LeadsTable.tsx
        │   ├── FilterBar.tsx
        │   ├── StatsBar.tsx
        │   ├── LeadCard.tsx
        │   ├── ContactInfo.tsx
        │   ├── AISummaryCard.tsx
        │   └── ExportButton.tsx
        ├── hooks/
        │   ├── useLeads.ts
        │   ├── useLeadDetail.ts
        │   └── useSummarize.ts
        └── api/
            └── client.ts        ← fetch wrapper, auth header injection
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend | Node.js + Express + TypeScript | Familiar, fast to build |
| Database | PostgreSQL via Prisma ORM | Reliable, good TypeScript support |
| Frontend | React + TypeScript + TailwindCSS | Fast UI iteration |
| Auth | Clerk | Drop-in auth, handles JWT, free tier |
| Billing | Stripe | Industry standard, good webhook DX |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) | Best summarization quality |
| CSV parsing | PapaParse | Handles malformed CSVs gracefully |
| HTTP client | Axios | Server-side API calls |
| Scheduler | node-cron | Lightweight cron for daily data pull |
| Hosting | Railway | Auto-detects Node, managed PostgreSQL |
| Build | Vite | Fast HMR for React development |

---

## Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/motivio

# Clerk Auth
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...       # The $79/month price ID

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# PropertyRadar (Phase 2 — leave blank for MVP)
PROPERTY_RADAR_API_KEY=

# Admin
ADMIN_SECRET=...                # Protects the CSV import endpoint
PORT=3001
NODE_ENV=development
```

---

## County CSV Format Differences

Each county exports NODs in a different column format.
CSVImporter must normalize all three into the leads schema.
Build per-county normalizer functions — NOT a generic one.

### Alameda County
- Owner field: "Trustor" or "Grantor"
- Date format: MM/DD/YYYY
- Address: often split across "Situs Address" + "Situs City"
- Document type filter: look for "NOTICE OF DEFAULT"

### Contra Costa County
- Owner field: "Owner Name"
- Date format: MM/DD/YYYY
- Address: "Property Address" single field
- Access via CCMAP portal and Laserfiche Weblink
- Document type: "NOTICE OF DEFAULT" or "NOD"

### San Mateo County
- Owner field: "Trustor"
- Date format: YYYY-MM-DD (ISO)
- Address: "Property Street Address"
- Some records have legal description only — requires APN lookup
  to get street address. Flag these for manual review, don't skip.
- Document type: "Notice of Default"

### Normalizer output for all three:
```typescript
interface LeadRecord {
  county: 'Alameda' | 'Contra Costa' | 'San Mateo'
  lead_type: 'NOD' | 'tax_delinquent'
  owner_name: string | null
  property_address: string       // "123 Main St"
  city: string | null
  zip: string | null
  filing_date: Date
  loan_amount: number | null
  trustee_name: string | null
  source: string
  source_file: string | null
  external_id: string | null
}
```

---

## Key Business Rules

1. **days_since_filing** — always computed at query time from filing_date.
   Never stored. Formula: `CURRENT_DATE - filing_date`.

2. **Deduplication** — deduplicate on property_address + filing_date.
   Same property can have multiple NODs over time — that's valid.
   Same property + same filing date = duplicate, skip silently.

3. **Enrichment is manual-trigger only** — never auto-enrich on import.
   Skip tracing costs money per record. User must explicitly trigger.

4. **AI summaries are cached forever** — once generated, never
   regenerate unless user explicitly clicks "Regenerate". Never call
   Claude on page load. Always check cache first.

5. **Source data is immutable** — never overwrite imported county data.
   Enrichment and summaries are additive layers. Raw source fields
   remain exactly as imported for audit trail.

6. **County is always required on import** — no orphan records.

7. **Subscription gate** — all API endpoints except /health, /api/webhooks,
   and login require an active or trialing Clerk session. Dashboard
   and export additionally require subscription_status of 'active'
   or 'trialing'. Show upgrade prompt if subscription is cancelled
   or past_due.

---

## Styling Tokens

```css
--navy:   #0D2137   /* headings, footer */
--teal:   #0B7A75   /* primary CTA, badges, accents */
--gold:   #C8902A   /* amber urgency, highlights */
--red:    #9B2335   /* urgent leads, errors */
--green:  #1A7A4A   /* high equity, success */
--gray-dark:  #2C3E50   /* body text */
--gray-mid:   #5A6A7A   /* secondary text */
--gray-light: #E0E4EA   /* borders */
--bg-primary: #FFFFFF
--bg-secondary: #F7F8FA  /* alternating rows, cards */
--teal-light: #E6F4F3   /* AI summary card background */
```

Font: Inter (Google Fonts) with system font fallback.

---

## First Task for Claude Code

Read this entire CLAUDE.md. Then execute the following in order:

### Step 1 — Scaffold project structure
Create all directories and files listed in Project Structure above.
Create stub files — correct exports and TypeScript types, no logic yet.

### Step 2 — Prisma schema
Create prisma/schema.prisma with all four tables defined above.
Include all fields, types, relations, and indexes on:
- leads: (property_address, filing_date) for deduplication
- leads: (county, filing_date) for common filter queries
- leads: (lead_type, filing_date) for lead type filtering
- enrichment: (lead_id) unique
- ai_summaries: (lead_id) unique

### Step 3 — Express server skeleton
Create server/index.ts with:
- All route files mounted at correct paths
- CORS configured for localhost:5173 (Vite dev server)
- JSON body parser
- Clerk auth middleware imported but not yet applied to routes
- GET /health returning { status: 'ok', timestamp: new Date() }

### Step 4 — React + Vite + Tailwind
Initialize client/ with:
- Vite config with React plugin and proxy to localhost:3001
- Tailwind configured with the color tokens above as custom colors
- Clerk provider wrapping the app
- React Router with routes for /, /leads/:id, /login, /subscribe
- Placeholder page components for all four routes

### Step 5 — Environment config
Create .env.example with all variables listed above.
Create a README.md with setup instructions:
  1. npm install
  2. Copy .env.example to .env.local and fill in values
  3. npx prisma migrate dev
  4. npm run dev (starts both server and client)

### Step 6 — Verify
Running `npm run dev` from root should:
- Start Express server on port 3001
- Start Vite dev server on port 5173
- GET /health returns 200
- React app loads at localhost:5173 with placeholder pages
- No TypeScript errors

Do not build any feature logic until this skeleton is confirmed working.
Report what was created and any decisions made that deviated from this spec.