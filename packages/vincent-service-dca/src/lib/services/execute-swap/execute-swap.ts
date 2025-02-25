import { Types } from 'mongoose';

import { PurchasedCoin } from '../../models/purchased-coin.model';
import { fetchTopBaseMemeCoins } from '../fetch-base-meme-coins';
import { logger } from '../../logger';

interface ExecuteSwapParams {
  user: Types.ObjectId;
  purchasedAt: Date;
}

export async function executeSwap({
  user,
  purchasedAt,
}: ExecuteSwapParams): Promise<InstanceType<typeof PurchasedCoin> | null> {
  try {
    logger.debug('Fetching top coin...');
    const topCoin = await fetchTopBaseMemeCoins();
    logger.debug('Got top coin:', topCoin);

    // Create a purchase record
    const purchase = new PurchasedCoin({
      user,
      coinAddress: topCoin.coinAddress,
      symbol: topCoin.symbol,
      amount: 100, // Mock amount for testing
      priceAtPurchase: parseFloat(topCoin.price),
      txHash: `0x${Math.random().toString(16).slice(2)}`, // Mock transaction hash
      purchasedAt,
    });
    await purchase.save();

    logger.debug(`Successfully created purchase record for ${topCoin.symbol}`);
    return purchase;
  } catch (error) {
    logger.error('Purchase failed:', error);
    return null;
  }
}
