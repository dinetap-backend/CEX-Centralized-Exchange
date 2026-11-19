import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createWallet,
  depositToWallet,
  getWallet,
  getWalletTransactions,
  withdrawFromWallet,
} from './walletService';

const runSuffix = (Date.now() % 0xffff).toString(16).padStart(4, '0');
const userId = (value: number) => `${runSuffix}${value.toString(16).padStart(20, '0')}`;

test('createWallet creates a wallet with a zero balance', async () => {
  const wallet = await createWallet(userId(1), 'USD');

  assert.equal(wallet.userId, userId(1));
  assert.equal(wallet.currency, 'USD');
  assert.equal(wallet.balance, 0);
});

test('depositToWallet adds funds to the wallet', async () => {
  const wallet = await depositToWallet(userId(2), 'BTC', 1.5);

  assert.equal(wallet.currency, 'BTC');
  assert.equal(wallet.balance, 1.5);
});

test('withdrawToWallet rejects insufficient funds', async () => {
  await createWallet(userId(3), 'ETH');

  await assert.rejects(
    async () => {
      await withdrawFromWallet(userId(3), 'ETH', 10);
    },
    { message: 'Insufficient funds in ETH wallet.' },
  );
});

test('getWallet returns the wallet record for a user and currency', async () => {
  await depositToWallet(userId(4), 'USDT', 250);
  const wallet = await getWallet(userId(4), 'USDT');

  assert.ok(wallet);
  assert.equal(wallet?.balance, 250);
});

test('getWalletTransactions returns wallet activity history', async () => {
  await depositToWallet(userId(5), 'BTC', 2);
  await withdrawFromWallet(userId(5), 'BTC', 0.5);

  const transactions = await getWalletTransactions(userId(5), 'BTC');

  assert.equal(transactions.length, 2);
  assert.ok(transactions.some((transaction) => transaction.type === 'deposit' && transaction.amount === 2));
  assert.ok(transactions.some((transaction) => transaction.type === 'withdrawal' && transaction.amount === 0.5));
});
