import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../services/authService';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
      };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Authentication required.' });

  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Invalid or expired token.' });

  req.user = user;
  return next();
}
