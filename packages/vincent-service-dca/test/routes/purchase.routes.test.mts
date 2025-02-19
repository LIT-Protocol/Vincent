import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fetch from 'node-fetch';

import '../setup.mts';
import { TestServer } from '../helpers/test-server.mjs';
import { User } from '../../src/lib/models/user.model.mjs';
import { PurchasedCoin } from '../../src/lib/models/purchased-coin.model.mjs';

describe('Purchase Routes', () => {
  let server: TestServer;
  let testUser: any;

  beforeEach(async () => {
    // Create and start test server
    server = new TestServer();
    await server.start();

    // Create a test user
    const user = new User({
      walletAddress: '0xTestWallet',
      purchaseIntervalSeconds: 3600, // 1 hour in seconds
    });
    testUser = await user.save();

    // Create some test purchases
    const purchases = [
      {
        userId: testUser._id,
        coinAddress: '0xCoin1',
        symbol: 'MEME1',
        amount: 100,
        priceAtPurchase: 1.5,
        txHash: '0xTx1',
        purchasedAt: new Date('2024-02-19T10:00:00Z'),
      },
      {
        userId: testUser._id,
        coinAddress: '0xCoin2',
        symbol: 'MEME2',
        amount: 200,
        priceAtPurchase: 2.5,
        txHash: '0xTx2',
        purchasedAt: new Date('2024-02-19T11:00:00Z'),
      },
    ];

    await PurchasedCoin.insertMany(purchases);
  }, 10000); // 10 second timeout for setup

  afterEach(async () => {
    await server.stop();
  }, 10000); // 10 second timeout for cleanup

  describe('GET /purchases/:walletAddress', () => {
    it('should get all purchases for a wallet address', async () => {
      const response = await fetch(
        `${server.baseUrl}/purchases/${testUser.walletAddress}`
      );

      expect(response.status).toBe(200);
      const purchases = await response.json();
      expect(Array.isArray(purchases)).toBe(true);
      expect(purchases.length).toBe(2);
      expect(purchases[0].symbol).toBe('MEME2'); // Most recent first
      expect(purchases[1].symbol).toBe('MEME1');
    });

    it('should return 404 for non-existent wallet', async () => {
      const response = await fetch(`${server.baseUrl}/purchases/0xNonExistent`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /purchases/:walletAddress/latest', () => {
    it('should get latest purchase for a wallet address', async () => {
      const response = await fetch(
        `${server.baseUrl}/purchases/${testUser.walletAddress}/latest`
      );

      expect(response.status).toBe(200);
      const purchase = await response.json();
      expect(purchase.symbol).toBe('MEME2');
      expect(purchase.amount).toBe(200);
    });

    it('should return 404 for wallet with no purchases', async () => {
      // Create a new user with no purchases
      const newUser = await new User({
        walletAddress: '0xEmptyWallet',
        purchaseIntervalSeconds: 3600,
      }).save();

      const response = await fetch(
        `${server.baseUrl}/purchases/${newUser.walletAddress}/latest`
      );

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent wallet', async () => {
      const response = await fetch(
        `${server.baseUrl}/purchases/0xNonExistent/latest`
      );

      expect(response.status).toBe(404);
    });
  });
});
