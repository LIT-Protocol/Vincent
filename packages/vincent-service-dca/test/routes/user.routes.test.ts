import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fetch from 'node-fetch';
import '../setup.ts';
import { TestServer } from '../helpers/test-server';

describe('User Routes', () => {
  let server: TestServer;

  beforeEach(async () => {
    server = new TestServer();
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const response = await fetch(`${server.baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: '0xTestWallet1',
          purchaseIntervalSeconds: 3600,
        }),
      });

      expect(response.status).toBe(201);
      const user = await response.json();
      expect(user.walletAddress).toBe('0xTestWallet1');
      expect(user.purchaseIntervalSeconds).toBe(3600);
    });

    it('should reject duplicate wallet addresses', async () => {
      // Create first user
      await fetch(`${server.baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: '0xTestWallet2',
          purchaseIntervalSeconds: 3600,
        }),
      });

      // Try to create duplicate
      const response = await fetch(`${server.baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: '0xTestWallet2',
          purchaseIntervalSeconds: 1800,
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /users/:walletAddress', () => {
    it('should get user by wallet address', async () => {
      // Create user first
      await fetch(`${server.baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: '0xTestWallet3',
          purchaseIntervalSeconds: 3600,
        }),
      });

      // Get user
      const response = await fetch(`${server.baseUrl}/users/0xTestWallet3`);

      expect(response.status).toBe(200);
      const user = await response.json();
      expect(user.walletAddress).toBe('0xTestWallet3');
    });

    it('should return 404 for non-existent wallet', async () => {
      const response = await fetch(`${server.baseUrl}/users/0xNonExistent`);
      expect(response.status).toBe(404);
    });
  });

  describe('GET /users', () => {
    it('should list all users', async () => {
      // Create some users
      await fetch(`${server.baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: '0xTestWallet4',
          purchaseIntervalSeconds: 3600,
        }),
      });

      await fetch(`${server.baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: '0xTestWallet5',
          purchaseIntervalSeconds: 1800,
        }),
      });

      const response = await fetch(`${server.baseUrl}/users`);

      expect(response.status).toBe(200);
      const users = await response.json();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThanOrEqual(2);
    });
  });
});
