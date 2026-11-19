import { API_BASE_URL } from '../config/api';

export type WalletBalance = {
  id: string;
  currency: string;
  balance: number;
  updatedAt: string;
};

export type TradeRecord = {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  notional: number;
  fee: number;
  status: string;
  createdAt: string;
};

export type PortfolioSummary = {
  accountValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  volume: number;
  pnl: number;
  maxDrawdown: number;
  totalEquity: number;
  tradingEquity: number;
  earnBalance: number;
  wallets: WalletBalance[];
  trades: TradeRecord[];
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data as T;
}

export function getPortfolio() {
  return request<PortfolioSummary>('/trading/portfolio');
}

export function placeMarketTrade(symbol: string, side: 'buy' | 'sell', quantity: number) {
  return request<TradeRecord>('/trading/orders', {
    method: 'POST',
    body: JSON.stringify({ symbol, side, quantity }),
  });
}
