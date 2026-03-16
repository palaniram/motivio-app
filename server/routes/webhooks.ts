import { Router, raw } from 'express'

const router = Router()

router.post('/clerk', (req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

// Stripe webhook needs raw body for signature verification
router.post('/stripe', raw({ type: 'application/json' }), (req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

export default router
