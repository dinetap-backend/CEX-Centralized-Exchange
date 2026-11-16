import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  createWallet,
  depositToWallet,
  getWallet,
  getWalletsForUser,
  getWalletTransactions,
  withdrawFromWallet,
} from '../services/walletService';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const wallets = await getWalletsForUser(req.user!.id);
    return res.json(wallets);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load wallets.';
    return res.status(400).json({ error: message });
  }
});

router.get('/:currency', async (req, res) => {
  try {
    const wallet = await getWallet(req.user!.id, req.params.currency);

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    const transactions = await getWalletTransactions(req.user!.id, req.params.currency);

    return res.json({ wallet, transactions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load wallet.';
    return res.status(400).json({ error: message });
  }
});

router.post('/:currency/deposit', async (req, res) => {
  try {
    const amount = Number(req.body.amount ?? 0);
    const wallet = await depositToWallet(req.user!.id, req.params.currency, amount);
    return res.status(201).json(wallet);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Deposit failed.';
    return res.status(400).json({ error: message });
  }
});

router.post('/:currency/withdraw', async (req, res) => {
  try {
    const amount = Number(req.body.amount ?? 0);
    const wallet = await withdrawFromWallet(req.user!.id, req.params.currency, amount);
    return res.json(wallet);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Withdrawal failed.';
    return res.status(400).json({ error: message });
  }
});

router.post('/:currency', async (req, res) => {
  try {
    const wallet = await createWallet(req.user!.id, req.params.currency);
    return res.status(201).json(wallet);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Wallet creation failed.';
    return res.status(400).json({ error: message });
  }
});

export default router;
