import { API_BASE_URL } from '../config/api';

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
  interval: string;
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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }

  return data as T;
}

export async function getMarketOverview(): Promise<MarketTicker[]> {
  return request<MarketTicker[]>('/market');
}

export async function getMarketHistory(symbol: string, interval = '1h', limit = 24): Promise<MarketCandle[]> {
  const query = new URLSearchParams({ interval, limit: String(limit) });
  return request<MarketCandle[]>(`/market/${encodeURIComponent(symbol)}/candles?${query.toString()}`);
}

export async function getMarketOrderBook(symbol: string): Promise<MarketOrderBook> {
  return request<MarketOrderBook>(`/market/${encodeURIComponent(symbol)}/orderbook`);
}

export async function getRecentTrades(symbol: string, limit = 12): Promise<MarketTrade[]> {
  const query = new URLSearchParams({ limit: String(limit) });
  return request<MarketTrade[]>(`/market/${encodeURIComponent(symbol)}/trades?${query.toString()}`);
}
