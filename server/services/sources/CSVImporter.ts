import Papa from 'papaparse'
import { DataSource, LeadRecord } from './DataSource.js'
import { normalize } from '../normalizer.js'
import { deduplicate, checkExisting } from '../deduplicator.js'
import prisma from '../../lib/prisma.js'

export interface CSVImportResult {
  imported: number
  duplicates: number
  errors: string[]
}

export class CSVImporter implements DataSource {
  private csvContent: string
  private county: string
  private leadType: string
  private sourceFile: string

  constructor(csvContent: string, county: string, leadType: string, sourceFile: string) {
    this.csvContent = csvContent
    this.county = county
    this.leadType = leadType
    this.sourceFile = sourceFile
  }

  /**
   * Parse CSV, normalize, deduplicate, and return LeadRecords.
   * Does NOT insert into DB — use import() for the full pipeline.
   */
  async fetch(): Promise<LeadRecord[]> {
    const parsed = Papa.parse<Record<string, string>>(this.csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    })

    const records: LeadRecord[] = []
    const errors: string[] = []

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i]
      try {
        const record = normalize(row, this.county, this.leadType, this.sourceFile)
        records.push(record)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push(`Row ${i + 2}: ${message}`)
      }
    }

    // Also include parse-level errors
    if (parsed.errors.length > 0) {
      for (const e of parsed.errors) {
        errors.push(`CSV parse error at row ${(e.row ?? 0) + 2}: ${e.message}`)
      }
    }

    return records
  }

  /**
   * Full import pipeline: parse → normalize → deduplicate within batch →
   * check DB for existing → insert new records → return results.
   */
  async import(): Promise<CSVImportResult> {
    const errors: string[] = []

    // 1. Parse CSV
    const parsed = Papa.parse<Record<string, string>>(this.csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    })

    // Collect parse-level errors
    if (parsed.errors.length > 0) {
      for (const e of parsed.errors) {
        errors.push(`CSV parse error at row ${(e.row ?? 0) + 2}: ${e.message}`)
      }
    }

    // 2. Normalize each row
    const records: LeadRecord[] = []
    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i]
      try {
        const record = normalize(row, this.county, this.leadType, this.sourceFile)
        records.push(record)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push(`Row ${i + 2}: ${message}`)
      }
    }

    if (records.length === 0) {
      return { imported: 0, duplicates: 0, errors }
    }

    // 3. Deduplicate within batch
    const { unique, duplicateCount: batchDuplicates } = deduplicate(records)

    // 4. Check against existing DB records
    const { new: newRecords, existingCount: dbDuplicates } = await checkExisting(unique, prisma)

    const totalDuplicates = batchDuplicates + dbDuplicates

    if (newRecords.length === 0) {
      return { imported: 0, duplicates: totalDuplicates, errors }
    }

    // 5. Insert new records into DB
    let importedCount = 0
    const INSERT_BATCH_SIZE = 50

    for (let i = 0; i < newRecords.length; i += INSERT_BATCH_SIZE) {
      const batch = newRecords.slice(i, i + INSERT_BATCH_SIZE)
      try {
        const result = await prisma.lead.createMany({
          data: batch.map((r) => ({
            county: r.county,
            lead_type: r.lead_type,
            owner_name: r.owner_name,
            property_address: r.property_address,
            city: r.city,
            zip: r.zip,
            filing_date: r.filing_date,
            loan_amount: r.loan_amount,
            trustee_name: r.trustee_name,
            source: r.source,
            source_file: r.source_file,
            external_id: r.external_id,
          })),
          skipDuplicates: true, // Safety net for race conditions
        })
        importedCount += result.count
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push(`DB insert error (batch starting at row ${i}): ${message}`)
      }
    }

    return {
      imported: importedCount,
      duplicates: totalDuplicates,
      errors,
    }
  }
}
