import { Router } from 'express';
import {
  getMarketHistory,
  getMarketOrderBook,
  getMarketTicker,
  getRecentTrades,
  listMarkets,
  type CandleInterval,
} from './market.service';

const router = Router();
const candleIntervals = new Set<CandleInterval>(['1m', '5m', '15m', '1h', '4h', '1d']);

router.get('/', async (_req, res) => {
  try {
    return res.json(await listMarkets());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load market data.';
    return res.status(400).json({ error: message });
  }
});

router.get('/:symbol', async (req, res) => {
  try {
    return res.json(await getMarketTicker(req.params.symbol));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load ticker.';
    return res.status(404).json({ error: message });
  }
});

router.get('/:symbol/candles', async (req, res) => {
  try {
    const intervalValue = (req.query.interval as string | undefined) ?? '1h';
    const interval: CandleInterval = candleIntervals.has(intervalValue as CandleInterval)
      ? (intervalValue as CandleInterval)
      : '1h';
    const limit = Number(req.query.limit ?? 24);

    return res.json(await getMarketHistory(req.params.symbol, interval, limit));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load market candles.';
    return res.status(400).json({ error: message });
  }
});

router.get('/:symbol/orderbook', async (req, res) => {
  try {
    return res.json(await getMarketOrderBook(req.params.symbol));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load order book.';
    return res.status(400).json({ error: message });
  }
});

router.get('/:symbol/trades', async (req, res) => {
  try {
    const limit = Number(req.query.limit ?? 12);
    return res.json(await getRecentTrades(req.params.symbol, limit));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load recent trades.';
    return res.status(400).json({ error: message });
  }
});

export default router;
