import {
  delegator,
  delegatee,
  funder,
  appManager,
  ensureUnexpiredCapacityToken,
  getChainHelpers,
  getEnv,
  type PkpInfo,
} from '@lit-protocol/vincent-e2e-test-utils';
import { type PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import * as util from 'node:util';
import { z } from 'zod';

import { bundledVincentAbility as hyperliquidBundledAbility } from '../../src';
import { ethers, type Wallet, type providers } from 'ethers';
import * as hyperliquid from '@nktkas/hyperliquid';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Hyperliquid Ability E2E Deposit Tests', () => {
  const ENV = getEnv({
    ARBITRUM_RPC_URL: z.string(),
  });
  const USDC_DEPOSIT_AMOUNT = '6000000';
  const USE_TESTNET = false;

  let agentPkpInfo: PkpInfo;
  let wallets: {
    appDelegatee: Wallet;
    funder: Wallet;
    appManager: Wallet;
    agentWalletOwner: Wallet;
  };
  let arbitrumRpcProvider: providers.JsonRpcProvider;

  beforeAll(async () => {
    await funder.checkFunderBalance();
    await delegatee.ensureAppDelegateeFunded();
    await appManager.ensureAppManagerFunded();

    const chainHelpers = await getChainHelpers();
    wallets = chainHelpers.wallets;
    arbitrumRpcProvider = new ethers.providers.JsonRpcProvider(ENV.ARBITRUM_RPC_URL);

    await ensureUnexpiredCapacityToken(wallets.appDelegatee);

    const PERMISSION_DATA: PermissionData = {
      // Hyperliquid Ability has no policies
      [hyperliquidBundledAbility.ipfsCid]: {},
    };

    const abilityIpfsCids: string[] = Object.keys(PERMISSION_DATA);
    const abilityPolicies: string[][] = abilityIpfsCids.map((abilityIpfsCid) => {
      return Object.keys(PERMISSION_DATA[abilityIpfsCid]);
    });

    // If an app exists for the delegatee, we will create a new app version with the new ipfs cids
    // Otherwise, we will create an app w/ version 1 appVersion with the new ipfs cids
    const existingApp = await delegatee.getAppInfo();
    console.log('[beforeAll] existingApp', existingApp);
    let appId: number;
    let appVersion: number;
    if (!existingApp) {
      console.log('[beforeAll] No existing app, registering new app');
      const newApp = await appManager.registerNewApp({ abilityIpfsCids, abilityPolicies });
      appId = newApp.appId;
      appVersion = newApp.appVersion;
    } else {
      console.log('[beforeAll] Existing app, registering new app version');
      const newAppVersion = await appManager.registerNewAppVersion({
        abilityIpfsCids,
        abilityPolicies,
      });
      appId = existingApp.appId;
      appVersion = newAppVersion.appVersion;
    }

    agentPkpInfo = await delegator.getFundedAgentPkp();

    await delegator.permitAppVersionForAgentWalletPkp({
      permissionData: PERMISSION_DATA,
      appId,
      appVersion,
      agentPkpInfo,
    });

    await delegator.addPermissionForAbilities(
      wallets.agentWalletOwner,
      agentPkpInfo.tokenId,
      abilityIpfsCids,
    );
  });

  afterAll(async () => {
    await disconnectVincentAbilityClients();
  });

  describe('Precheck & Execute Swap Success', () => {
    it('should execute the HyperLiquid Ability precheck method', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
      });

      const precheckResult = await hyperliquidAbilityClient.precheck(
        {
          action: 'deposit',
          useTestnet: USE_TESTNET,
          deposit: {
            amount: USDC_DEPOSIT_AMOUNT,
          },
          arbitrumRpcUrl: ENV.ARBITRUM_RPC_URL,
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(precheckResult).toBeDefined();
      console.log(
        '[should successfully run precheck on the Hyperliquid Ability]',
        util.inspect(precheckResult, { depth: 10 }),
      );

      if (precheckResult.success === false) {
        throw new Error(precheckResult.runtimeError);
      }
    });

    it('should execute the Hyperliquid Ability to make a deposit from the Agent Wallet PKP into the HyperLiquid bridge', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
      });

      const executeResult = await hyperliquidAbilityClient.execute(
        {
          action: 'deposit',
          useTestnet: USE_TESTNET,
          deposit: {
            amount: USDC_DEPOSIT_AMOUNT,
          },
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(executeResult).toBeDefined();
      console.log(
        '[should execute the Hyperliquid Ability to make a deposit from the Agent Wallet PKP into the HyperLiquid bridge]',
        util.inspect(executeResult, { depth: 10 }),
      );

      expect(executeResult.success).toBe(true);
      if (executeResult.success === false) {
        // A bit redundant, but typescript doesn't understand `expect().toBe(true)` is narrowing to the type.
        throw new Error(executeResult.runtimeError);
      }

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.txHash).toBeDefined();

      const txHash = executeResult.result.txHash;
      expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      const txReceipt = await arbitrumRpcProvider.waitForTransaction(txHash as string, 1);
      expect(txReceipt.status).toBe(1);
    });

    // NOTE It takes about a minute for the deposit to be reflected in the portfolio.
    // This test assumes a previous deposit has been made by the Agent Wallet PKP into the HyperLiquid bridge.
    it('should verify the Agent Wallet PKP has funds in the HyperLiquid portfolio', async () => {
      const transport = new hyperliquid.HttpTransport({ isTestnet: USE_TESTNET });
      const infoClient = new hyperliquid.InfoClient({ transport });

      // Check clearinghouse state which includes account balance
      const clearinghouseState = await infoClient.clearinghouseState({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      expect(clearinghouseState).toBeDefined();
      console.log(
        '[should verify the Agent Wallet PKP has funds in the HyperLiquid portfolio] Clearinghouse state',
        util.inspect(clearinghouseState, { depth: 10 }),
      );

      // Verify the account exists and has funds
      if ('marginSummary' in clearinghouseState && clearinghouseState.marginSummary) {
        const marginSummary = clearinghouseState.marginSummary as {
          accountValue?: string;
          totalMarginUsed?: string;
          totalNtlPos?: string;
          totalRawUsd?: string;
          crossMarginSummary?: {
            marginUsed?: string;
            accountValue?: string;
          };
        };
        expect(marginSummary.accountValue || marginSummary.totalRawUsd).toBeDefined();
        const accountValue = marginSummary.accountValue || marginSummary.totalRawUsd || '0';
        expect(parseFloat(accountValue)).toBeGreaterThan(0);
        console.log('Clearinghouse account value:', accountValue);
      }
    });
  });
});
