import { Request, Response, NextFunction } from 'express'

// Stub: pass-through for now. Will integrate Clerk JWT verification.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  next()
}
