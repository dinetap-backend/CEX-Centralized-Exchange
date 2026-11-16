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

const wallets = new Map<string, Wallet>();
const walletTransactions = new Map<string, WalletTransaction[]>();

const normalizeCurrency = (currency: string) => currency.trim().toUpperCase();

const normalizeUserId = (userId: string) => userId.trim();

const walletKey = (userId: string, currency: string) => `${normalizeUserId(userId)}:${normalizeCurrency(currency)}`;

const recordTransaction = (wallet: Wallet, type: 'deposit' | 'withdrawal', amount: number) => {
  const key = walletKey(wallet.userId, wallet.currency);
  const existing = walletTransactions.get(key) ?? [];

  const transaction: WalletTransaction = {
    id: crypto.randomUUID(),
    walletId: wallet.id,
    userId: wallet.userId,
    currency: wallet.currency,
    type,
    amount,
    createdAt: new Date().toISOString(),
    balanceAfter: wallet.balance,
  };

  walletTransactions.set(key, [transaction, ...existing]);

  return transaction;
};

export async function createWallet(userId: string, currency: string): Promise<Wallet> {
  const safeUserId = normalizeUserId(userId);
  const safeCurrency = normalizeCurrency(currency);

  if (!safeUserId) {
    throw new Error('User ID is required.');
  }

  if (!safeCurrency) {
    throw new Error('Currency is required.');
  }

  const key = walletKey(safeUserId, safeCurrency);
  const existingWallet = wallets.get(key);

  if (existingWallet) {
    return existingWallet;
  }

  const wallet: Wallet = {
    id: crypto.randomUUID(),
    userId: safeUserId,
    currency: safeCurrency,
    balance: 0,
    updatedAt: new Date().toISOString(),
  };

  wallets.set(key, wallet);

  return wallet;
}

export async function getWallet(userId: string, currency: string): Promise<Wallet | null> {
  const safeUserId = normalizeUserId(userId);
  const safeCurrency = normalizeCurrency(currency);

  if (!safeUserId || !safeCurrency) {
    return null;
  }

  return wallets.get(walletKey(safeUserId, safeCurrency)) ?? null;
}

export async function getWalletsForUser(userId: string): Promise<Wallet[]> {
  const safeUserId = normalizeUserId(userId);

  if (!safeUserId) {
    return [];
  }

  return Array.from(wallets.values()).filter((wallet) => wallet.userId === safeUserId);
}

const parseAmount = (input: number, label: string) => {
  const amount = Number(input);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${label} amount must be greater than 0.`);
  }

  return Number(amount.toFixed(8));
};

export async function depositToWallet(userId: string, currency: string, amount: number): Promise<Wallet> {
  const wallet = await createWallet(userId, currency);
  const safeAmount = parseAmount(amount, 'Deposit');

  wallet.balance = Number((wallet.balance + safeAmount).toFixed(8));
  wallet.updatedAt = new Date().toISOString();
  recordTransaction(wallet, 'deposit', safeAmount);

  return wallet;
}

export async function withdrawFromWallet(userId: string, currency: string, amount: number): Promise<Wallet> {
  const wallet = await createWallet(userId, currency);
  const safeAmount = parseAmount(amount, 'Withdrawal');

  if (wallet.balance < safeAmount) {
    throw new Error(`Insufficient funds in ${wallet.currency} wallet.`);
  }

  wallet.balance = Number((wallet.balance - safeAmount).toFixed(8));
  wallet.updatedAt = new Date().toISOString();
  recordTransaction(wallet, 'withdrawal', safeAmount);

  return wallet;
}

export async function getWalletTransactions(userId: string, currency: string): Promise<WalletTransaction[]> {
  const safeUserId = normalizeUserId(userId);
  const safeCurrency = normalizeCurrency(currency);

  if (!safeUserId || !safeCurrency) {
    return [];
  }

  return walletTransactions.get(walletKey(safeUserId, safeCurrency)) ?? [];
}
