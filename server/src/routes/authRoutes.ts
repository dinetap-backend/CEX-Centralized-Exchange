import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { loginUser, registerUser } from '../services/authService';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    const result = await registerUser({ name: name ?? '', email: email ?? '', password: password ?? '' });

    return res.status(201).json(result);
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

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed.';
    return res.status(401).json({ error: message });
  }
});

router.get('/me', authenticate, (req, res) => {
  return res.json({ user: req.user });
});

export default router;
