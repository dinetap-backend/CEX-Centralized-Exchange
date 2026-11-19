import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../../modules/auth/auth.service';

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
  const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const cookieHeader = req.headers.cookie ?? '';
  const cookieToken = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('token='));

  const token = headerToken ?? (cookieToken ? decodeURIComponent(cookieToken.slice('token='.length)) : null);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  req.user = user;
  return next();
}
