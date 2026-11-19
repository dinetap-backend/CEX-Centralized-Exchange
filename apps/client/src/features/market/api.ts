import { API_BASE_URL } from '../../config/api';

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

export async function getMarkets() {
  const response = await fetch(`${API_BASE_URL}/market`);
  if (!response.ok) {
    throw new Error('Failed to load markets.');
  }
  return response.json() as Promise<MarketTicker[]>;
}

export async function getMarketTicker(symbol: string) {
  const response = await fetch(`${API_BASE_URL}/market/${symbol}`);
  if (!response.ok) {
    throw new Error('Failed to load market ticker.');
  }
  return response.json() as Promise<MarketTicker>;
}
