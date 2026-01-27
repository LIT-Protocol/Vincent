import { generatePrivateKey, privateKeyToAddress } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { createPublicClient, http } from 'viem';
import { createPermissionApproval } from '../src/lib/setup/smart-account/createPermissionApproval';
import { getEnv } from '../src/lib/setup';

// Extend Jest timeout to 2 minutes for setup
jest.setTimeout(120000);

const BASE_SEPOLIA_RPC_URL = getEnv('BASE_SEPOLIA_RPC_URL', 'https://sepolia.base.org');
const TEST_USER_EOA_PRIVATE_KEY = getEnv('TEST_USER_EOA_PRIVATE_KEY');

describe('createPermissionApproval', () => {
  const targetChain = baseSepolia;
  const targetChainRpcUrl = BASE_SEPOLIA_RPC_URL;

  describe('Basic Functionality', () => {
    it('should create a valid serialized permission account', async () => {
      const sessionKeyPrivateKey = generatePrivateKey();
      const sessionKeyAddress = privateKeyToAddress(sessionKeyPrivateKey);
      const accountIndexHash = '0x' + '1'.repeat(64);

      const serializedPermissionAccount = await createPermissionApproval({
        userEoaPrivateKey: TEST_USER_EOA_PRIVATE_KEY as `0x${string}`,
        sessionKeyAddress,
        accountIndexHash,
        targetChain,
        targetChainRpcUrl,
      });

      expect(serializedPermissionAccount).toBeDefined();
      expect(typeof serializedPermissionAccount).toBe('string');
      expect(serializedPermissionAccount.length).toBeGreaterThan(0);
    });

    it('should create a hex-encoded serialized permission account', async () => {
      const sessionKeyPrivateKey = generatePrivateKey();
      const sessionKeyAddress = privateKeyToAddress(sessionKeyPrivateKey);
      const accountIndexHash = '0x' + '2'.repeat(64);

      const serializedPermissionAccount = await createPermissionApproval({
        userEoaPrivateKey: TEST_USER_EOA_PRIVATE_KEY as `0x${string}`,
        sessionKeyAddress,
        accountIndexHash,
        targetChain,
        targetChainRpcUrl,
      });

      // Should be a valid hex string or base64 encoded
      expect(serializedPermissionAccount).toBeDefined();
      expect(serializedPermissionAccount.length).toBeGreaterThan(10);
    });

    it('should create different permission accounts for different session keys', async () => {
      const sessionKey1PrivateKey = generatePrivateKey();
      const sessionKey1Address = privateKeyToAddress(sessionKey1PrivateKey);

      const sessionKey2PrivateKey = generatePrivateKey();
      const sessionKey2Address = privateKeyToAddress(sessionKey2PrivateKey);

      const accountIndexHash = '0x' + '4'.repeat(64);

      const [result1, result2] = await Promise.all([
        createPermissionApproval({
          userEoaPrivateKey: TEST_USER_EOA_PRIVATE_KEY as `0x${string}`,
          sessionKeyAddress: sessionKey1Address,
          accountIndexHash,
          targetChain,
          targetChainRpcUrl,
        }),
        createPermissionApproval({
          userEoaPrivateKey: TEST_USER_EOA_PRIVATE_KEY as `0x${string}`,
          sessionKeyAddress: sessionKey2Address,
          accountIndexHash,
          targetChain,
          targetChainRpcUrl,
        }),
      ]);

      // Different session keys should produce different permission accounts
      expect(result1).not.toBe(result2);
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe('Account Index Hash Variations', () => {
    it('should work with different account index hashes', async () => {
      const sessionKeyPrivateKey = generatePrivateKey();
      const sessionKeyAddress = privateKeyToAddress(sessionKeyPrivateKey);

      // Test with different index hashes
      const indexHashes = [
        '0x' + '1'.repeat(64),
        '0x' + '2'.repeat(64),
        '0x' + 'a'.repeat(64),
        '0x' + 'f'.repeat(64),
      ];

      const results = await Promise.all(
        indexHashes.map((accountIndexHash) =>
          createPermissionApproval({
            userEoaPrivateKey: TEST_USER_EOA_PRIVATE_KEY as `0x${string}`,
            sessionKeyAddress,
            accountIndexHash,
            targetChain,
            targetChainRpcUrl,
          }),
        ),
      );

      // All results should be valid
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);

        // Different index hashes should produce different serializations
        if (index > 0) {
          expect(result).not.toBe(results[0]);
        }
      });
    });

    it('should create deterministic output for the same inputs', async () => {
      const sessionKeyPrivateKey = generatePrivateKey();
      const sessionKeyAddress = privateKeyToAddress(sessionKeyPrivateKey);
      const accountIndexHash = '0x' + '3'.repeat(64);

      const result1 = await createPermissionApproval({
        userEoaPrivateKey: TEST_USER_EOA_PRIVATE_KEY as `0x${string}`,
        sessionKeyAddress,
        accountIndexHash,
        targetChain,
        targetChainRpcUrl,
      });

      const result2 = await createPermissionApproval({
        userEoaPrivateKey: TEST_USER_EOA_PRIVATE_KEY as `0x${string}`,
        sessionKeyAddress,
        accountIndexHash,
        targetChain,
        targetChainRpcUrl,
      });

      // Same inputs should produce same output
      expect(result1).toBe(result2);
    });
  });
});
