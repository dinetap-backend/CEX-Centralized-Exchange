import { Router } from 'express';
import type { Response } from 'express';
import { isProduction } from '../../config/env';
import { loginUser, registerUser, verifyToken } from './auth.service';

const router = Router();

const setAuthCookie = (res: Response, token: string) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    const result = await registerUser({ name: name ?? '', email: email ?? '', password: password ?? '' });

    setAuthCookie(res, result.token);

    return res.status(201).json({ user: result.user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed.';
    return res.status(400).json({ error: message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    const result = await loginUser({ email: email ?? '', password: password ?? '' });

    setAuthCookie(res, result.token);

    return res.json({ user: result.user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed.';
    return res.status(401).json({ error: message });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token', { path: '/', httpOnly: true, sameSite: 'lax', secure: isProduction });
  return res.json({ success: true });
});

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization ?? '';
  const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const cookieHeader = req.headers.cookie ?? '';
  const cookieToken = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('token='));

  const token = headerToken ?? (cookieToken ? decodeURIComponent(cookieToken.slice('token='.length)) : null);
  const user = token ? verifyToken(token) : null;

  return res.json({ user });
});

export default router;
