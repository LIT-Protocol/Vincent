import type { FastifyInstance } from 'fastify';
import { User } from '../models/user.model.mjs';
import { PurchasedCoin } from '../models/purchased-coin.model.mjs';

export async function purchaseRoutes(fastify: FastifyInstance) {
  // Get all purchases for a wallet address
  fastify.get('/purchases/:walletAddress', async (request, reply) => {
    const { walletAddress } = request.params as { walletAddress: string };
    const user = await User.findOne({ walletAddress });

    if (!user) {
      reply.code(404).send({ error: 'User not found' });
      return;
    }

    const purchases = await PurchasedCoin.find({ userId: user._id })
      .lean()
      .sort({
        purchasedAt: -1,
      });

    return purchases;
  });

  // Get latest purchase for a wallet address
  fastify.get('/purchases/:walletAddress/latest', async (request, reply) => {
    const { walletAddress } = request.params as { walletAddress: string };
    const user = await User.findOne({ walletAddress }).lean();

    if (!user) {
      reply.code(404).send({ error: 'User not found' });
      return;
    }

    const latestPurchase = await PurchasedCoin.findOne({
      userId: user._id,
    })
      .lean()
      .sort({ purchasedAt: -1 });

    if (!latestPurchase) {
      reply.code(404).send({ error: 'No purchases found for this user' });
      return;
    }

    return latestPurchase;
  });
}
