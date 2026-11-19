import express from 'express';
import cors from 'cors';
import { env } from '../config/env';
import authRoutes from '../modules/auth/auth.routes';
import marketRoutes from '../modules/market/market.routes';
import walletRoutes from '../modules/wallet/wallet.routes';
import tradingRoutes from '../modules/trading/trading.routes';

export function createApp() {
  const app = express();

  const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Portfolio API is running' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/market', marketRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/trading', tradingRoutes);

  app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body as {
      name?: string;
      email?: string;
      message?: string;
    };

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Thanks! Your message has been received.',
    });
  });

  return app;
}

export const PORT = env.PORT;
export const app = createApp();
