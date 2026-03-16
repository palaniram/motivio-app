import { Router, Request, Response } from 'express'
import multer from 'multer'
import { CSVImporter } from '../services/sources/CSVImporter.js'

const router = Router()

// Use memory storage — CSV files are small, no need to write to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Only CSV files are accepted'))
    }
  },
})

const VALID_COUNTIES = ['Alameda', 'Contra Costa', 'San Mateo']
const VALID_LEAD_TYPES = ['NOD', 'tax_delinquent']

router.post('/csv', upload.single('file'), async (req: Request, res: Response) => {
  try {
    // Admin secret check
    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret) {
      res.status(500).json({ error: 'ADMIN_SECRET not configured on server' })
      return
    }

    const providedSecret = req.headers['x-admin-secret']
    if (providedSecret !== adminSecret) {
      res.status(401).json({ error: 'Unauthorized — invalid or missing x-admin-secret header' })
      return
    }

    // Validate file
    if (!req.file) {
      res.status(400).json({ error: 'Missing required file. Upload a CSV as form field "file".' })
      return
    }

    // Validate county
    const county = req.body.county as string | undefined
    if (!county || !VALID_COUNTIES.includes(county)) {
      res.status(400).json({
        error: `Missing or invalid county. Must be one of: ${VALID_COUNTIES.join(', ')}`,
      })
      return
    }

    // Validate leadType
    const leadType = req.body.leadType as string | undefined
    if (!leadType || !VALID_LEAD_TYPES.includes(leadType)) {
      res.status(400).json({
        error: `Missing or invalid leadType. Must be one of: ${VALID_LEAD_TYPES.join(', ')}`,
      })
      return
    }

    // Parse the CSV buffer to string
    const csvContent = req.file.buffer.toString('utf-8')
    const sourceFile = req.file.originalname

    // Run the import pipeline
    const importer = new CSVImporter(csvContent, county, leadType, sourceFile)
    const result = await importer.import()

    res.json({
      imported: result.imported,
      duplicates: result.duplicates,
      errors: result.errors,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('CSV import error:', message)
    res.status(500).json({ error: `Import failed: ${message}` })
  }
})

export default router
