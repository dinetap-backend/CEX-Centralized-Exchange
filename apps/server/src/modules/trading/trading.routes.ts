import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authMiddleware';
import { prisma } from '../../config/database';
import { getMarketTicker } from '../market/market.service';
import { getTradeHistory, placeTrade } from './trading.service';

const router = Router();
router.use(authenticate);

router.post('/orders', async (req, res) => {
  try {
    const trade = await placeTrade({
      userId: req.user!.id,
      symbol: String(req.body.symbol ?? ''),
      side: req.body.side === 'sell' ? 'sell' : 'buy',
      quantity: Number(req.body.quantity ?? 0),
    });
    return res.status(201).json(trade);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to place trade.';
    return res.status(400).json({ error: message });
  }
});

router.get('/history', async (req, res) => {
  return res.json(await getTradeHistory(req.user!.id));
});

router.get('/portfolio', async (req, res) => {
  const userId = req.user!.id;
  const [wallets, trades] = await Promise.all([
    prisma.wallet.findMany({ where: { userId }, orderBy: { currency: 'asc' } }),
    prisma.trade.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
  ]);

  let accountValue = 0;
  for (const wallet of wallets) {
    if (wallet.currency === 'USD') {
      accountValue += wallet.balance;
    } else {
      try {
        const ticker = await getMarketTicker(`${wallet.currency}/USD`);
        accountValue += wallet.balance * ticker.price;
      } catch {
        accountValue += 0;
      }
    }
  }

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const recentTrades = trades.filter((trade) => trade.createdAt >= fourteenDaysAgo);
  const volume = recentTrades.reduce((sum, trade) => sum + trade.notional, 0);

  return res.json({
    accountValue,
    unrealizedPnl: 0,
    unrealizedPnlPercent: 0,
    volume,
    pnl: 0,
    maxDrawdown: 0,
    totalEquity: accountValue,
    tradingEquity: accountValue,
    earnBalance: 0,
    wallets: wallets.map((wallet) => ({
      id: wallet.id,
      currency: wallet.currency,
      balance: wallet.balance,
      updatedAt: wallet.updatedAt.toISOString(),
    })),
    trades: trades.map((trade) => ({
      id: trade.id,
      symbol: trade.symbol,
      side: trade.side,
      quantity: trade.quantity,
      price: trade.price,
      notional: trade.notional,
      fee: trade.fee,
      status: trade.status,
      createdAt: trade.createdAt.toISOString(),
    })),
  });
});

export default router;
