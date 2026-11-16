import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createWallet,
  depositToWallet,
  getWallet,
  getWalletTransactions,
  withdrawFromWallet,
} from './walletService';

test('createWallet creates a wallet with a zero balance', async () => {
  const wallet = await createWallet('user-1', 'USD');

  assert.equal(wallet.userId, 'user-1');
  assert.equal(wallet.currency, 'USD');
  assert.equal(wallet.balance, 0);
});

test('depositToWallet adds funds to the wallet', async () => {
  const wallet = await depositToWallet('user-2', 'BTC', 1.5);

  assert.equal(wallet.currency, 'BTC');
  assert.equal(wallet.balance, 1.5);
});

test('withdrawToWallet rejects insufficient funds', async () => {
  await createWallet('user-3', 'ETH');

  await assert.rejects(
    async () => {
      await withdrawFromWallet('user-3', 'ETH', 10);
    },
    {
      message: 'Insufficient funds in ETH wallet.',
    },
  );
});

test('getWallet returns the wallet record for a user and currency', async () => {
  await depositToWallet('user-4', 'USDT', 250);
  const wallet = await getWallet('user-4', 'USDT');

  assert.ok(wallet);
  assert.equal(wallet?.balance, 250);
});

test('getWalletTransactions returns wallet activity history', async () => {
  await depositToWallet('user-5', 'BTC', 2);
  await withdrawFromWallet('user-5', 'BTC', 0.5);

  const transactions = await getWalletTransactions('user-5', 'BTC');

  assert.equal(transactions.length, 2);
  assert.ok(transactions[0]);
  assert.ok(transactions[1]);
  assert.equal(transactions[0]!.type, 'deposit');
  assert.equal(transactions[0]!.amount, 2);
  assert.equal(transactions[1]!.type, 'withdrawal');
  assert.equal(transactions[1]!.amount, 0.5);
});
