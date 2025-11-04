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

describe('Hyperliquid Ability E2E Transfer to Spot Tests', () => {
  const ENV = getEnv({
    ARBITRUM_RPC_URL: z.string(),
  });
  const USDC_TRANSFER_AMOUNT = '1000000';

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
        appVersion: existingApp.appVersion,
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
          action: 'transferToSpot',
          transferToSpot: {
            amount: USDC_TRANSFER_AMOUNT,
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

      expect(precheckResult.result).toBeDefined();
      expect(precheckResult.result.action).toBe('transferToSpot');
      expect(BigInt(precheckResult.result.availableUsdcBalance)).toBeGreaterThan(0n);
    });

    it('should execute the Hyperliquid Ability to make a transfer to spot from the Agent Wallet PKP', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
      });

      const executeResult = await hyperliquidAbilityClient.execute(
        {
          action: 'transferToSpot',
          transferToSpot: {
            amount: USDC_TRANSFER_AMOUNT,
          },
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(executeResult).toBeDefined();
      console.log(
        '[should execute the Hyperliquid Ability to make a transfer to spot from the Agent Wallet PKP]',
        util.inspect(executeResult, { depth: 10 }),
      );

      expect(executeResult.success).toBe(true);
      if (executeResult.success === false) {
        // A bit redundant, but typescript doesn't understand `expect().toBe(true)` is narrowing to the type.
        throw new Error(executeResult.runtimeError);
      }

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.action).toBe('transferToSpot');
    });

    it('should verify the Agent Wallet PKP has spot balance in HyperLiquid', async () => {
      const transport = new hyperliquid.HttpTransport();
      const infoClient = new hyperliquid.InfoClient({ transport });

      // Check spot clearinghouse state for token balances
      const spotState = await infoClient.spotClearinghouseState({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      expect(spotState).toBeDefined();
      console.log(
        '[should verify the Agent Wallet PKP has spot balance in HyperLiquid] Spot clearinghouse state',
        util.inspect(spotState, { depth: 10 }),
      );

      // Verify spot balances exist
      expect(spotState.balances).toBeDefined();
      expect(Array.isArray(spotState.balances)).toBe(true);

      if (spotState.balances.length > 0) {
        console.log(
          `[should verify the Agent Wallet PKP has spot balance in HyperLiquid] Found ${spotState.balances.length} token balance(s):`,
        );
        spotState.balances.forEach((balance) => {
          const available = parseFloat(balance.total) - parseFloat(balance.hold);
          console.log(
            `  - ${balance.coin}: total=${balance.total}, hold=${balance.hold}, available=${available.toFixed(6)}`,
          );
        });

        // Check if we have USDC balance
        const usdcBalance = spotState.balances.find((b) => b.coin === 'USDC');
        if (usdcBalance) {
          const totalBalance = parseFloat(usdcBalance.total);
          expect(totalBalance).toBeGreaterThan(0);
          console.log(
            '[should verify the Agent Wallet PKP has spot balance in HyperLiquid] USDC balance verified:',
            usdcBalance.total,
          );
        }
      } else {
        console.log(
          '[should verify the Agent Wallet PKP has spot balance in HyperLiquid] No token balances found',
        );
      }
    });
  });
});
