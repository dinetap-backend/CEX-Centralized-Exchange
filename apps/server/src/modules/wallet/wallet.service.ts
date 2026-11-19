import { prisma } from '../../config/database';

export type Wallet = { id: string; userId: string; currency: string; balance: number; updatedAt: string };
export type WalletTransaction = { id: string; walletId: string; userId: string; currency: string; type: 'deposit' | 'withdrawal'; amount: number; createdAt: string; balanceAfter: number };

const normalizeCurrency = (currency: string) => currency.trim().toUpperCase();

const toWallet = (wallet: { id: string; userId: string; currency: string; balance: number; updatedAt: Date }): Wallet => ({
  id: wallet.id,
  userId: wallet.userId,
  currency: wallet.currency,
  balance: wallet.balance,
  updatedAt: wallet.updatedAt.toISOString(),
});

export async function createWallet(userId: string, currency: string): Promise<Wallet> {
  const safeCurrency = normalizeCurrency(currency);
  if (!userId.trim()) throw new Error('User ID is required.');
  if (!safeCurrency) throw new Error('Currency is required.');

  const wallet = await prisma.wallet.upsert({
    where: { userId_currency: { userId, currency: safeCurrency } },
    update: {},
    create: { userId, currency: safeCurrency, balance: 0 },
  });
  return toWallet(wallet);
}

export async function getWallet(userId: string, currency: string): Promise<Wallet | null> {
  const safeCurrency = normalizeCurrency(currency);
  if (!userId.trim() || !safeCurrency) return null;
  const wallet = await prisma.wallet.findUnique({ where: { userId_currency: { userId, currency: safeCurrency } } });
  return wallet ? toWallet(wallet) : null;
}

export async function getWalletsForUser(userId: string): Promise<Wallet[]> {
  if (!userId.trim()) return [];
  const wallets = await prisma.wallet.findMany({ where: { userId }, orderBy: { currency: 'asc' } });
  return wallets.map(toWallet);
}

const parseAmount = (input: number, label: string) => {
  const amount = Number(input);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error(`${label} amount must be greater than 0.`);
  return Number(amount.toFixed(8));
};

export async function depositToWallet(userId: string, currency: string, amount: number): Promise<Wallet> {
  const safeCurrency = normalizeCurrency(currency);
  const safeAmount = parseAmount(amount, 'Deposit');
  const wallet = await createWallet(userId, safeCurrency);
  const updated = await prisma.wallet.update({
    where: { id: wallet.id },
    data: { balance: { increment: safeAmount } },
  });
  await prisma.transaction.create({
    data: { walletId: wallet.id, userId, currency: safeCurrency, type: 'deposit', amount: safeAmount, balanceAfter: updated.balance },
  });
  return toWallet(updated);
}

export async function withdrawFromWallet(userId: string, currency: string, amount: number): Promise<Wallet> {
  const safeCurrency = normalizeCurrency(currency);
  const safeAmount = parseAmount(amount, 'Withdrawal');
  const wallet = await createWallet(userId, safeCurrency);
  if (wallet.balance < safeAmount) throw new Error(`Insufficient funds in ${wallet.currency} wallet.`);

  const updated = await prisma.wallet.update({
    where: { id: wallet.id },
    data: { balance: { decrement: safeAmount } },
  });
  await prisma.transaction.create({
    data: { walletId: wallet.id, userId, currency: safeCurrency, type: 'withdrawal', amount: safeAmount, balanceAfter: updated.balance },
  });
  return toWallet(updated);
}

export async function getWalletTransactions(userId: string, currency: string): Promise<WalletTransaction[]> {
  const safeCurrency = normalizeCurrency(currency);
  if (!userId.trim() || !safeCurrency) return [];
  const transactions = await prisma.transaction.findMany({
    where: { userId, currency: safeCurrency },
    orderBy: { createdAt: 'desc' },
  });
  return transactions.map((transaction) => ({
    id: transaction.id,
    walletId: transaction.walletId,
    userId: transaction.userId,
    currency: transaction.currency,
    type: transaction.type,
    amount: transaction.amount,
    createdAt: transaction.createdAt.toISOString(),
    balanceAfter: transaction.balanceAfter,
  }));
}
