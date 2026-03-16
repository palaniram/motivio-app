import { Router } from 'express'

const router = Router()

router.get('/csv', (req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

export default router
