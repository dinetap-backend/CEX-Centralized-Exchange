import { API_BASE_URL } from '../config/api';

export type Wallet = {
  id: string;
  userId: string;
  currency: string;
  balance: number;
  updatedAt: string;
};

export type WalletTransaction = {
  id: string;
  walletId: string;
  userId: string;
  currency: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  createdAt: string;
  balanceAfter: number;
};

export type WalletDetail = {
  wallet: Wallet;
  transactions: WalletTransaction[];
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('portfolio-token');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }

  return data as T;
}

export async function getWallets(token: string): Promise<Wallet[]> {
  return request<Wallet[]>('/wallet', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getWalletDetail(token: string, currency: string): Promise<WalletDetail> {
  return request<WalletDetail>(`/wallet/${encodeURIComponent(currency)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createWallet(token: string, currency: string): Promise<Wallet> {
  return request<Wallet>(`/wallet/${encodeURIComponent(currency)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function depositWallet(token: string, currency: string, amount: number): Promise<Wallet> {
  return request<Wallet>(`/wallet/${encodeURIComponent(currency)}/deposit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount }),
  });
}

export async function withdrawWallet(token: string, currency: string, amount: number): Promise<Wallet> {
  return request<Wallet>(`/wallet/${encodeURIComponent(currency)}/withdraw`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount }),
  });
}
