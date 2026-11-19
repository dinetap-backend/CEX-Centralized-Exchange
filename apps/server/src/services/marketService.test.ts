import assert from 'node:assert/strict';
import test from 'node:test';

import { getMarketHistory, getMarketOrderBook, getMarketTicker, getRecentTrades, listMarkets } from './marketService';

test('listMarkets returns the configured exchange instruments', async () => {
  const markets = await listMarkets();

  assert.ok(markets.length >= 3);
  assert.equal(markets[0]?.symbol, 'BTC/USD');
});

test('getMarketTicker returns a valid price snapshot', async () => {
  const snapshot = await getMarketTicker('ETH/USD');

  assert.equal(snapshot.symbol, 'ETH/USD');
  assert.ok(snapshot.price > 0);
  assert.ok(snapshot.changePercent !== undefined);
});

test('getMarketHistory returns a candle list with the requested length', async () => {
  const candles = await getMarketHistory('BTC/USD', '1h', 12);

  assert.equal(candles.length, 12);
  assert.ok(Array.isArray(candles));
  assert.ok(candles[0]?.time);
  assert.ok(candles[0]?.close > 0);
});

test('getMarketOrderBook returns bid and ask depth for the selected market', async () => {
  const orderBook = await getMarketOrderBook('SOL/USD', 3);

  assert.equal(orderBook.bids.length, 3);
  assert.equal(orderBook.asks.length, 3);
  assert.ok(orderBook.spread > 0);
  assert.ok(orderBook.midPrice > 0);
});

test('getRecentTrades returns a valid trade stream', async () => {
  const trades = await getRecentTrades('DOGE/USD', 5);

  assert.equal(trades.length, 5);
  assert.ok(trades.every((trade) => trade.side === 'buy' || trade.side === 'sell'));
  assert.ok(trades.every((trade) => trade.size > 0));
});
