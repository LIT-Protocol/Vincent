import { ethers } from 'ethers';
import { privateKeyToAccount } from 'viem/accounts';

import { getTestClient } from '../../src';
import {
  DATIL_PUBLIC_CLIENT,
  TEST_APP_DELEGATEE_ACCOUNT,
  TEST_APP_MANAGER_PRIVATE_KEY,
  TEST_APP_MANAGER_VIEM_WALLET_CLIENT,
  BASE_SEPOLIA_RPC_URL,
} from './index';

/**
 * Removes TEST_APP_DELEGATEE_ACCOUNT from an existing App if needed.
 */
export async function removeAppDelegateeIfNeeded(
  delegateeAddress = TEST_APP_DELEGATEE_ACCOUNT.address,
): Promise<void> {
  console.log('🔄 Checking if Delegatee is registered to an App...');

  let registeredApp = null;
  const expectedManager = privateKeyToAccount(
    TEST_APP_MANAGER_PRIVATE_KEY as `0x${string}`,
  ).address;
  const client = getTestClient({
    signer: new ethers.Wallet(
      TEST_APP_MANAGER_PRIVATE_KEY,
      new ethers.providers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL),
    ),
  });
  const resolveDelegateeApp = async () => {
    try {
      return await client.getAppByDelegateeAddress({
        delegateeAddress,
      });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.message.includes('DelegateeNotRegistered') ||
          error.message.includes('Failed to Get App By Delegatee'))
      ) {
        return null;
      }
      throw error;
    }
  };
  try {
    // Use the contracts-sdk method to get the app by delegatee
    registeredApp = await resolveDelegateeApp();

    if (registeredApp && registeredApp.manager !== expectedManager) {
      throw new Error(
        `❌ App Delegatee: ${delegateeAddress} is already registered to App ID: ${registeredApp.id}, and TEST_APP_MANAGER_PRIVATE_KEY (${expectedManager}) is not the owner (${registeredApp.manager}).`,
      );
    }

    if (registeredApp) {
      console.log(
        `ℹ️  App Delegatee: ${delegateeAddress} is already registered to App ID: ${registeredApp.id}. Removing Delegatee...`,
      );
      console.log(
        `ℹ️  App ID ${registeredApp.id} manager: ${registeredApp.manager}, deleted: ${registeredApp.isDeleted}`,
      );

      if (registeredApp.isDeleted) {
        console.log(
          `ℹ️  App ID: ${registeredApp.id} is deleted. Undeleting to remove delegatee...`,
        );
        try {
          await client.undeleteApp({ appId: registeredApp.id });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(
            `❌ Failed to undelete App ID ${registeredApp.id} (manager ${registeredApp.manager}, expected ${expectedManager}). ${message}`,
          );
        }
      }

      let result;
      try {
        result = await client.removeDelegatee({
          appId: registeredApp.id,
          delegateeAddress,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`❌ Failed to remove delegatee for App ID ${registeredApp.id}: ${message}`);
      }

      console.log(
        `ℹ️  Removed Delegatee from App ID: ${registeredApp.id}\nTx hash: ${result.txHash}`,
      );

      const remainingApp = await resolveDelegateeApp();
      if (remainingApp) {
        console.log(
          `ℹ️  Delegatee is still registered to App ID: ${remainingApp.id}. Clearing all delegatees...`,
        );
        await client.setDelegatee({
          appId: remainingApp.id,
          delegateeAddresses: [],
        });
      }

      const finalApp = await resolveDelegateeApp();
      if (finalApp) {
        throw new Error(
          `❌ Delegatee ${delegateeAddress} is still registered to App ID: ${finalApp.id} after removal.`,
        );
      }
    }
  } catch (error: unknown) {
    // Check if the error is a DelegateeNotRegistered revert
    if (
      error instanceof Error &&
      (error.message.includes('DelegateeNotRegistered') ||
        error.message.includes('Failed to Get App By Delegatee'))
    ) {
      console.log(`ℹ️  App Delegatee: ${delegateeAddress} is not registered to any App.`);
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`❌ Error checking if delegatee is registered: ${message}`);
    }
  }
}

/**
 * Generates a random app ID
 * @returns A random app ID
 */
export function generateRandomAppId(): number {
  return Math.floor(Math.random() * (100_000_000_000 - 10_000_000_000)) + 10_000_000_000;
}

export function generateRandomIpfsCid(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return (
    'Qm' +
    Array.from({ length: 42 }, (): string => chars[Math.floor(Math.random() * chars.length)]).join(
      '',
    )
  );
}

/**
 * Funds TEST_APP_DELEGATEE if they have no Lit test tokens
 */
export async function fundAppDelegateeIfNeeded(): Promise<void> {
  const balance = await DATIL_PUBLIC_CLIENT.getBalance({
    address: TEST_APP_DELEGATEE_ACCOUNT.address,
  });
  if (balance === 0n) {
    const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.sendTransaction({
      to: TEST_APP_DELEGATEE_ACCOUNT.address,
      value: BigInt(10000000000000000), // 0.01 ETH in wei
    });
    const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: txHash,
    });
    console.log(`Funded TEST_APP_DELEGATEE with 0.01 ETH\nTx hash: ${txHash}`);
    expect(txReceipt.status).toBe('success');
  } else {
    expect(balance).toBeGreaterThan(0n);
  }
}
