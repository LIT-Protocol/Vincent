import { ethers } from 'ethers';
import { privateKeyToAccount } from 'viem/accounts';

import { getTestClient } from '../../src';
import {
  DATIL_PUBLIC_CLIENT,
  TEST_APP_DELEGATEE_ACCOUNT,
  TEST_APP_MANAGER_PRIVATE_KEY,
  TEST_APP_MANAGER_VIEM_WALLET_CLIENT,
  YELLOWSTONE_RPC_URL,
} from './index';

/**
 * Removes TEST_APP_DELEGATEE_ACCOUNT from an existing App if needed
 */
export async function removeAppDelegateeIfNeeded(): Promise<void> {
  console.log('🔄 Checking if Delegatee is registered to an App...');

  let registeredApp = null;
  try {
    // Use the contracts-sdk method to get the app by delegatee
    registeredApp = await getTestClient({
      signer: new ethers.Wallet(
        TEST_APP_MANAGER_PRIVATE_KEY,
        new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
      ),
    }).getAppByDelegateeAddress({
      delegateeAddress: TEST_APP_DELEGATEE_ACCOUNT.address,
    });

    if (
      registeredApp &&
      registeredApp.manager !==
        privateKeyToAccount(TEST_APP_MANAGER_PRIVATE_KEY as `0x${string}`).address
    ) {
      throw new Error(
        `❌ App Delegatee: ${TEST_APP_DELEGATEE_ACCOUNT.address} is already registered to App ID: ${registeredApp.id}, and TEST_APP_MANAGER_PRIVATE_KEY is not the owner of the App`,
      );
    }

    if (registeredApp) {
      console.log(
        `ℹ️  App Delegatee: ${TEST_APP_DELEGATEE_ACCOUNT.address} is already registered to App ID: ${registeredApp.id}. Removing Delegatee...`,
      );

      const result = await getTestClient({
        signer: new ethers.Wallet(
          TEST_APP_MANAGER_PRIVATE_KEY,
          new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
        ),
      }).removeDelegatee({
        appId: registeredApp.id,
        delegateeAddress: TEST_APP_DELEGATEE_ACCOUNT.address,
      });

      console.log(
        `ℹ️  Removed Delegatee from App ID: ${registeredApp.id}\nTx hash: ${result.txHash}`,
      );
    }
  } catch (error: unknown) {
    // Check if the error is a DelegateeNotRegistered revert
    if (
      error instanceof Error &&
      (error.message.includes('DelegateeNotRegistered') ||
        error.message.includes('Failed to Get App By Delegatee'))
    ) {
      console.log(
        `ℹ️  App Delegatee: ${TEST_APP_DELEGATEE_ACCOUNT.address} is not registered to any App.`,
      );
    } else {
      throw new Error(`❌ Error checking if delegatee is registered: ${(error as Error).message}`);
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
