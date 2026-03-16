import { LeadRecord } from './sources/DataSource.js'
import type { PrismaClient } from '@prisma/client'

/**
 * Builds a dedup key from property_address + filing_date.
 * Normalizes address to lowercase trimmed, and filing_date to YYYY-MM-DD.
 */
function dedupKey(record: LeadRecord): string {
  const address = record.property_address.toLowerCase().trim()
  const date = record.filing_date.toISOString().split('T')[0]
  return `${address}|${date}`
}

/**
 * Deduplicate within a batch of records.
 * Uses property_address + filing_date as the uniqueness key.
 * Keeps the first occurrence, skips subsequent duplicates.
 */
export function deduplicate(records: LeadRecord[]): {
  unique: LeadRecord[]
  duplicateCount: number
} {
  const seen = new Set<string>()
  const unique: LeadRecord[] = []
  let duplicateCount = 0

  for (const record of records) {
    const key = dedupKey(record)
    if (seen.has(key)) {
      duplicateCount++
    } else {
      seen.add(key)
      unique.push(record)
    }
  }

  return { unique, duplicateCount }
}

/**
 * Check which records already exist in the database.
 * Compares on property_address + filing_date (the unique constraint on the leads table).
 * Returns records that are new (not in DB) and a count of already-existing ones.
 */
export async function checkExisting(
  records: LeadRecord[],
  prisma: PrismaClient
): Promise<{
  new: LeadRecord[]
  existingCount: number
}> {
  if (records.length === 0) {
    return { new: [], existingCount: 0 }
  }

  // Collect all unique address+date pairs we need to check
  const pairs = records.map((r) => ({
    address: r.property_address,
    date: r.filing_date,
  }))

  // Query for existing records matching any of our address+date combos.
  // We batch this to avoid overly large queries.
  const BATCH_SIZE = 100
  const existingKeys = new Set<string>()

  for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
    const batch = pairs.slice(i, i + BATCH_SIZE)

    // Build OR conditions for this batch
    const conditions = batch.map((p) => ({
      property_address: p.address,
      filing_date: p.date,
    }))

    const existing = await prisma.lead.findMany({
      where: { OR: conditions },
      select: { property_address: true, filing_date: true },
    })

    for (const row of existing) {
      const address = row.property_address.toLowerCase().trim()
      const date = row.filing_date
        ? row.filing_date.toISOString().split('T')[0]
        : ''
      existingKeys.add(`${address}|${date}`)
    }
  }

  const newRecords: LeadRecord[] = []
  let existingCount = 0

  for (const record of records) {
    const key = dedupKey(record)
    if (existingKeys.has(key)) {
      existingCount++
    } else {
      newRecords.push(record)
    }
  }

  return { new: newRecords, existingCount }
}
