export type CandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export type MarketTicker = {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  changePercent: number;
  lastUpdated: string;
};

export type MarketCandle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  interval: CandleInterval;
};

export type MarketOrderBookEntry = {
  price: number;
  size: number;
  total: number;
};

export type MarketOrderBook = {
  bids: MarketOrderBookEntry[];
  asks: MarketOrderBookEntry[];
  spread: number;
  midPrice: number;
};

export type MarketTrade = {
  price: number;
  size: number;
  side: 'buy' | 'sell';
  time: string;
};

type MarketDefinition = {
  symbol: string;
  basePrice: number;
  volume: number;
  binancePair: string;
};

type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  priceChangePercent: string;
  closeTime: number;
};

type BinanceKline = [number, string, string, string, string, string, number, number, number, number, number, string];

const marketDefinitions: MarketDefinition[] = [
  { symbol: 'BTC/USD', basePrice: 68420, volume: 4200, binancePair: 'BTCUSDT' },
  { symbol: 'ETH/USD', basePrice: 3520, volume: 7800, binancePair: 'ETHUSDT' },
  { symbol: 'SOL/USD', basePrice: 154.2, volume: 15500, binancePair: 'SOLUSDT' },
  { symbol: 'XRP/USD', basePrice: 0.62, volume: 92800, binancePair: 'XRPUSDT' },
  { symbol: 'DOGE/USD', basePrice: 0.18, volume: 142000, binancePair: 'DOGEUSDT' },
];

const normalizeSymbol = (symbol: string) => symbol.trim().toUpperCase();

const resolveMarketDefinition = (symbol: string) => {
  const normalized = normalizeSymbol(symbol);
  return marketDefinitions.find((entry) => entry.symbol === normalized || entry.binancePair === normalized) ?? null;
};

const buildTickerForDefinition = (definition: MarketDefinition): MarketTicker => {
  const drift = Math.sin(Date.now() / 1000 / 180) * 0.02;
  const variance = Math.cos(Date.now() / 1000 / 240) * 0.014;
  const price = Number((definition.basePrice * (1 + drift + variance)).toFixed(2));
  const open = Number((price * (1 - variance * 0.7)).toFixed(2));
  const high = Number((price * (1 + Math.abs(variance) + 0.008)).toFixed(2));
  const low = Number((price * (1 - Math.abs(variance) - 0.008)).toFixed(2));
  const volume = Number((definition.volume * (1 + Math.abs(Math.sin(Date.now() / 4000)))).toFixed(2));
  const changePercent = Number((Math.sin(Date.now() / 1000 / 120) * 4.2).toFixed(2));

  return {
    symbol: definition.symbol,
    price,
    open,
    high,
    low,
    volume,
    changePercent,
    lastUpdated: new Date().toISOString(),
  };
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
};

const marketToBinanceSymbol = (symbol: string) => {
  const definition = resolveMarketDefinition(symbol);
  if (!definition) {
    throw new Error(`Market ${symbol} not found.`);
  }
  return definition.binancePair;
};

const mapTicker = (definition: MarketDefinition, payload: BinanceTicker): MarketTicker => ({
  symbol: definition.symbol,
  price: Number(payload.lastPrice),
  open: Number(payload.openPrice),
  high: Number(payload.highPrice),
  low: Number(payload.lowPrice),
  volume: Number(payload.volume),
  changePercent: Number(payload.priceChangePercent),
  lastUpdated: new Date(payload.closeTime).toISOString(),
});

const mapCandle = (interval: CandleInterval, candle: BinanceKline): MarketCandle => ({
  time: new Date(candle[0]).toISOString(),
  open: Number(candle[1]),
  high: Number(candle[2]),
  low: Number(candle[3]),
  close: Number(candle[4]),
  volume: Number(candle[5]),
  interval,
});

const buildOrderBookForDefinition = (definition: MarketDefinition, depth = 12): MarketOrderBook => {
  const bids: MarketOrderBookEntry[] = [];
  const asks: MarketOrderBookEntry[] = [];
  let runningBid = 0;
  let runningAsk = 0;

  for (let index = 0; index < depth; index += 1) {
    const bidPrice = Number((definition.basePrice * (1 - 0.0025 - index * 0.0007 - (index % 4) * 0.0002)).toFixed(2));
    const askPrice = Number((definition.basePrice * (1 + 0.0022 + index * 0.0007 + (index % 3) * 0.00025)).toFixed(2));
    const bidSize = Number((definition.volume / 900 * (1.2 + index * 0.35)).toFixed(3));
    const askSize = Number((definition.volume / 980 * (1.1 + index * 0.22)).toFixed(3));

    runningBid += bidSize;
    runningAsk += askSize;

    bids.push({ price: bidPrice, size: bidSize, total: Number(runningBid.toFixed(3)) });
    asks.push({ price: askPrice, size: askSize, total: Number(runningAsk.toFixed(3)) });
  }

  const bestBid = bids[0];
  const bestAsk = asks[0];
  const spread = bestAsk && bestBid ? Number((bestAsk.price - bestBid.price).toFixed(4)) : 0;
  const midPrice = bestAsk && bestBid ? Number(((bestAsk.price + bestBid.price) / 2).toFixed(2)) : definition.basePrice;

  return {
    bids: bids.sort((a, b) => b.price - a.price),
    asks: asks.sort((a, b) => a.price - b.price),
    spread,
    midPrice,
  };
};

const buildRecentTradesForDefinition = (definition: MarketDefinition, limit = 12): MarketTrade[] => {
  const trades: MarketTrade[] = [];
  let lastPrice = definition.basePrice;

  for (let index = 0; index < limit; index += 1) {
    const side: 'buy' | 'sell' = index % 2 === 0 ? 'buy' : 'sell';
    const randomWalk = (Math.sin((Date.now() / 1000) + index) * 0.01) + (index % 3) * 0.0015;
    lastPrice = Number((lastPrice * (1 + (side === 'buy' ? 1 : -1) * randomWalk)).toFixed(2));

    trades.push({
      price: lastPrice,
      size: Number((0.4 + (index % 6) * 0.18 + (index / limit) * 0.7).toFixed(3)),
      side,
      time: new Date(Date.now() - (limit - index) * 45_000).toISOString(),
    });
  }

  return trades;
};

export async function listMarkets(): Promise<MarketTicker[]> {
  const symbols = marketDefinitions.map((entry) => entry.binancePair).join(',');

  try {
    const data = await fetchJson<BinanceTicker[]>(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols.split(',')))}`);

    return marketDefinitions.map((definition) => {
      const match = data.find((item) => item.symbol === definition.binancePair);
      return match ? mapTicker(definition, match) : buildTickerForDefinition(definition);
    });
  } catch {
    return marketDefinitions.map((definition) => buildTickerForDefinition(definition));
  }
}

export async function getMarketTicker(symbol: string): Promise<MarketTicker> {
  const definition = resolveMarketDefinition(symbol);

  if (!definition) {
    throw new Error(`Market ${symbol} not found.`);
  }

  try {
    const data = await fetchJson<BinanceTicker>(`https://api.binance.com/api/v3/ticker/24hr?symbol=${marketToBinanceSymbol(symbol)}`);
    return mapTicker(definition, data);
  } catch {
    return buildTickerForDefinition(definition);
  }
}

export async function getMarketOrderBook(symbol: string, depth = 12): Promise<MarketOrderBook> {
  const definition = resolveMarketDefinition(symbol);

  if (!definition) {
    throw new Error(`Market ${symbol} not found.`);
  }

  return buildOrderBookForDefinition(definition, depth);
}

export async function getRecentTrades(symbol: string, limit = 12): Promise<MarketTrade[]> {
  const definition = resolveMarketDefinition(symbol);

  if (!definition) {
    throw new Error(`Market ${symbol} not found.`);
  }

  return buildRecentTradesForDefinition(definition, limit);
}

export async function getMarketHistory(
  symbol: string,
  interval: CandleInterval = '1h',
  limit = 24,
): Promise<MarketCandle[]> {
  const definition = resolveMarketDefinition(symbol);

  if (!definition) {
    throw new Error(`Market ${symbol} not found.`);
  }

  const normalizedInterval = ['1m', '5m', '15m', '1h', '4h', '1d'].includes(interval) ? interval : '1h';
  const candleLimit = Number.isFinite(limit) && Number(limit) > 0 ? Math.min(Math.max(Math.round(Number(limit)), 1), 200) : 24;

  try {
    const data = await fetchJson<BinanceKline[]>(
      `https://api.binance.com/api/v3/klines?symbol=${marketToBinanceSymbol(symbol)}&interval=${normalizedInterval}&limit=${candleLimit}`,
    );

    return data.map((candle) => mapCandle(normalizedInterval, candle));
  } catch {
    const points = candleLimit;
    const stepMs =
      normalizedInterval === '1m'
        ? 60_000
        : normalizedInterval === '5m'
          ? 5 * 60_000
          : normalizedInterval === '15m'
            ? 15 * 60_000
            : normalizedInterval === '4h'
              ? 4 * 60 * 60_000
              : normalizedInterval === '1d'
                ? 24 * 60 * 60_000
                : 60 * 60_000;

    const candles: MarketCandle[] = [];
    let previousClose = definition.basePrice;
    const now = Date.now();

    for (let index = 0; index < points; index += 1) {
      const time = new Date(now - (points - index) * stepMs).toISOString();
      const wave = Math.sin((index + 1) / 2.4) * 0.025;
      const drift = (index / points) * 0.018;
      const open = previousClose;
      const close = Number((open * (1 + wave + drift)).toFixed(2));
      const high = Number((Math.max(open, close) * (1 + 0.01 + Math.abs(Math.cos(index + 1)) * 0.015)).toFixed(2));
      const low = Number((Math.min(open, close) * (1 - 0.01 - Math.abs(Math.sin(index + 1)) * 0.015)).toFixed(2));
      const volume = Number((definition.volume * (0.7 + ((index % 6) + 1) / 12)).toFixed(2));

      candles.push({ time, open, high, low, close, volume, interval: normalizedInterval });
      previousClose = close;
    }

    return candles;
  }
}
