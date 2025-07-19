import { ethers } from 'ethers';
import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import {
  getAppByDelegateeAddress,
  permitApp,
  registerApp,
  removeDelegatee,
} from '@lit-protocol/vincent-contracts-sdk';
import {
  DATIL_PUBLIC_CLIENT,
  DELEGATEES,
  TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,
  TEST_APP_DELEGATEE_ACCOUNT,
  TEST_APP_MANAGER_PRIVATE_KEY,
  TEST_APP_MANAGER_VIEM_WALLET_CLIENT,
  TestConfig,
  YELLOWSTONE_RPC_URL,
  permitAuthMethods,
  saveTestConfig,
} from './index';
import { privateKeyToAccount } from 'viem/accounts';

/**
 * Permits all of the tools for the Agent Wallet PKP
 * @param toolIpfsCids - Array of tool IPFS CIDs to permit
 * @param testConfig - Test configuration
 */
export async function permitToolsForAgentWalletPkp(
  toolIpfsCids: string[],
  testConfig: TestConfig,
): Promise<void> {
  await permitAuthMethods.call(
    permitAuthMethods,
    ...[
      TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`,
      testConfig.userPkp!.tokenId!,
      toolIpfsCids,
    ],
  );
}

/**
 * Removes TEST_APP_DELEGATEE_ACCOUNT from an existing App if needed
 */
export async function removeAppDelegateeIfNeeded(): Promise<void> {
  console.log('🔄 Checking if Delegatee is registered to an App...');

  let registeredApp = null;
  try {
    // Use the contracts-sdk method to get the app by delegatee
    registeredApp = await getAppByDelegateeAddress({
      signer: new ethers.Wallet(
        TEST_APP_MANAGER_PRIVATE_KEY,
        new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
      ),
      args: {
        delegateeAddress: TEST_APP_DELEGATEE_ACCOUNT.address,
      },
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

      const result = await removeDelegatee({
        signer: new ethers.Wallet(
          TEST_APP_MANAGER_PRIVATE_KEY,
          new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
        ),
        args: {
          appId: registeredApp.id,
          delegateeAddress: TEST_APP_DELEGATEE_ACCOUNT.address,
        },
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
function generateRandomAppId(): number {
  return Math.floor(Math.random() * (100_000_000_000 - 10_000_000_000)) + 10_000_000_000;
}

/**
 * Registers a new app
 * @param toolIpfsCids - Array of tool IPFS CIDs to register
 * @param toolPolicies - Array of policy IPFS CIDs for each tool
 * @param testConfig - Test configuration
 * @param testConfigPath - Path to the test configuration file
 * @returns The updated test configuration
 */
export async function registerNewApp(
  toolIpfsCids: string[],
  toolPolicies: string[][],
  testConfig: TestConfig,
  testConfigPath: string,
): Promise<TestConfig> {
  const randomAppId = generateRandomAppId();
  const { txHash } = await registerApp({
    signer: new ethers.Wallet(
      TEST_APP_MANAGER_PRIVATE_KEY,
      new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
    ),
    args: {
      appId: randomAppId,
      delegateeAddresses: DELEGATEES,
      versionTools: {
        toolIpfsCids: toolIpfsCids,
        toolPolicies: toolPolicies,
      },
    },
  });

  testConfig.appId = randomAppId;
  testConfig.appVersion = 1;
  saveTestConfig(testConfigPath, testConfig);
  console.log(`Registered new App with ID: ${testConfig.appId}\nTx hash: ${txHash}`);

  return testConfig;
}

/**
 * Permits the app version for the Agent Wallet PKP
 * @param permissionData - Permission data for the app
 * @param testConfig - Test configuration
 */
export async function permitAppVersionForAgentWalletPkp(
  permissionData: PermissionData,
  testConfig: TestConfig,
): Promise<void> {
  const result = await permitApp({
    signer: new ethers.Wallet(
      TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as string,
      new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
    ),
    args: {
      pkpEthAddress: testConfig.userPkp!.ethAddress!,
      appId: testConfig.appId!,
      appVersion: testConfig.appVersion!,
      permissionData: permissionData,
    },
  });

  console.log(
    `Permitted App with ID ${testConfig.appId} and version ${testConfig.appVersion} for Agent Wallet PKP with token id ${testConfig.userPkp!.tokenId}\nTx hash: ${result.txHash}`,
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
