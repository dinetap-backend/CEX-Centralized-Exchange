import { prisma } from '../../config/database';
import { getMarketTicker } from '../market/market.service';

export type PlaceTradeInput = {
  userId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
};

const round = (value: number, digits = 8) => Number(value.toFixed(digits));

export async function placeTrade(input: PlaceTradeInput) {
  const quantity = Number(input.quantity);
  const symbol = input.symbol.trim().toUpperCase().replace('-', '/');

  if (!input.userId) throw new Error('Authentication required.');
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Quantity must be greater than 0.');

  const market = await getMarketTicker(symbol);
  const baseCurrency = symbol.split('/')[0] ?? '';
  if (!baseCurrency) throw new Error('Invalid market symbol.');

  const notional = round(quantity * market.price, 2);
  const fee = round(notional * 0.00045, 2);

  return prisma.$transaction(async (tx) => {
    const usd = await tx.wallet.upsert({
      where: { userId_currency: { userId: input.userId, currency: 'USD' } },
      update: {},
      create: { userId: input.userId, currency: 'USD', balance: 0 },
    });

    const asset = await tx.wallet.upsert({
      where: { userId_currency: { userId: input.userId, currency: baseCurrency } },
      update: {},
      create: { userId: input.userId, currency: baseCurrency, balance: 0 },
    });

    if (input.side === 'buy') {
      const cost = round(notional + fee, 2);
      if (usd.balance < cost) throw new Error(`Insufficient USD balance. ${cost.toFixed(2)} USD required.`);

      await tx.wallet.update({ where: { id: usd.id }, data: { balance: { decrement: cost } } });
      await tx.wallet.update({ where: { id: asset.id }, data: { balance: { increment: quantity } } });

      await tx.transaction.create({
        data: { walletId: usd.id, userId: input.userId, currency: 'USD', type: 'withdrawal', amount: cost, balanceAfter: round(usd.balance - cost, 2) },
      });
    } else {
      if (asset.balance < quantity) throw new Error(`Insufficient ${baseCurrency} balance.`);

      const proceeds = round(notional - fee, 2);
      await tx.wallet.update({ where: { id: asset.id }, data: { balance: { decrement: quantity } } });
      await tx.wallet.update({ where: { id: usd.id }, data: { balance: { increment: proceeds } } });

      await tx.transaction.create({
        data: { walletId: usd.id, userId: input.userId, currency: 'USD', type: 'deposit', amount: proceeds, balanceAfter: round(usd.balance + proceeds, 2) },
      });
    }

    return tx.trade.create({
      data: {
        userId: input.userId,
        symbol,
        side: input.side,
        quantity,
        price: market.price,
        notional,
        fee,
      },
    });
  });
}

export async function getTradeHistory(userId: string) {
  const trades = await prisma.trade.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return trades.map((trade) => ({
    id: trade.id,
    symbol: trade.symbol,
    side: trade.side,
    quantity: trade.quantity,
    price: trade.price,
    notional: trade.notional,
    fee: trade.fee,
    status: trade.status,
    createdAt: trade.createdAt.toISOString(),
  }));
}
