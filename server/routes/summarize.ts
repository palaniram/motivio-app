import { Router } from 'express'

const router = Router()

router.post('/:id/summarize', (req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

export default router
