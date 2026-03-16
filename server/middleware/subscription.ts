import { Request, Response, NextFunction } from 'express'

// Stub: pass-through for now. Will gate on active/trialing subscription.
export function requireSubscription(req: Request, res: Response, next: NextFunction) {
  next()
}
