import {
  delegator,
  delegatee,
  funder,
  appManager,
  ensureUnexpiredCapacityToken,
  getChainHelpers,
  getEnv,
  type PkpInfo,
  setupVincentDevelopmentEnvironment,
} from '@lit-protocol/vincent-e2e-test-utils';
import { type PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import * as util from 'node:util';
import { z } from 'zod';
import { type Wallet } from 'ethers';
import * as hyperliquid from '@nktkas/hyperliquid';

import { bundledVincentAbility as hyperliquidBundledAbility } from '../../../src';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Hyperliquid Ability E2E Transfer USDC to Spot/Perp Tests', () => {
  const ENV = getEnv({
    ARBITRUM_RPC_URL: z.string(),
  });
  const USDC_TRANSFER_AMOUNT = '9000000'; // 9 USDC
  const USE_TESTNET = true;

  let agentPkpInfo: PkpInfo;
  let wallets: {
    appDelegatee: Wallet;
    funder: Wallet;
    appManager: Wallet;
    agentWalletOwner: Wallet;
  };
  let transport: hyperliquid.HttpTransport;
  let infoClient: hyperliquid.InfoClient;

  beforeAll(async () => {
    await funder.checkFunderBalance();
    await delegatee.ensureAppDelegateeFunded();
    await appManager.ensureAppManagerFunded();

    const chainHelpers = await getChainHelpers();
    wallets = chainHelpers.wallets;

    await ensureUnexpiredCapacityToken(wallets.appDelegatee);

    const PERMISSION_DATA: PermissionData = {
      // Hyperliquid Ability has no policies
      [hyperliquidBundledAbility.ipfsCid]: {},
    };

    const vincentDevEnvironment = await setupVincentDevelopmentEnvironment({
      permissionData: PERMISSION_DATA,
    });
    agentPkpInfo = vincentDevEnvironment.agentPkpInfo;
    wallets = vincentDevEnvironment.wallets;

    transport = new hyperliquid.HttpTransport({ isTestnet: USE_TESTNET });
    infoClient = new hyperliquid.InfoClient({ transport });
  });

  afterAll(async () => {
    await disconnectVincentAbilityClients();
  });

  describe('[Transfer to Perp] Precheck & Execute Swap Success', () => {
    let initialPerpBalance: string;
    const expectedTransferAmount = parseFloat(USDC_TRANSFER_AMOUNT) / 1_000_000; // Convert from micro-units to whole USDC

    beforeAll(async () => {
      // Get initial perp balance before transfer
      const clearinghouseState = await infoClient.clearinghouseState({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      if ('marginSummary' in clearinghouseState && clearinghouseState.marginSummary) {
        const marginSummary = clearinghouseState.marginSummary as {
          accountValue?: string;
          totalRawUsd?: string;
        };
        initialPerpBalance = marginSummary.accountValue || marginSummary.totalRawUsd || '0';
        console.log('[beforeAll] Initial perp balance:', initialPerpBalance);
      } else {
        throw new Error('Unable to fetch initial perp balance');
      }
    });

    it('should execute the HyperLiquid Ability precheck method for transfer to perp', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: false,
      });

      const precheckResult = await hyperliquidAbilityClient.precheck(
        {
          action: 'transferToPerp',
          useTestnet: USE_TESTNET,
          transfer: {
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
        '[should successfully run precheck on the Hyperliquid Ability for transfer to perp]',
        util.inspect(precheckResult, { depth: 10 }),
      );

      if (precheckResult.success === false) {
        throw new Error(precheckResult.runtimeError);
      }

      expect(precheckResult.result).toBeDefined();
      expect(precheckResult.result.action).toBe('transferToPerp');
      expect(BigInt(precheckResult.result.availableBalance as string)).toBeGreaterThan(0n);
    });

    it('should execute the Hyperliquid Ability to make a transfer to perp from the Agent Wallet PKP', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: false,
      });

      const executeResult = await hyperliquidAbilityClient.execute(
        {
          action: 'transferToPerp',
          useTestnet: USE_TESTNET,
          transfer: {
            amount: USDC_TRANSFER_AMOUNT,
          },
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(executeResult).toBeDefined();
      console.log(
        '[should execute the Hyperliquid Ability to make a transfer to perp from the Agent Wallet PKP]',
        util.inspect(executeResult, { depth: 10 }),
      );

      expect(executeResult.success).toBe(true);
      if (executeResult.success === false) {
        // A bit redundant, but typescript doesn't understand `expect().toBe(true)` is narrowing to the type.
        throw new Error(executeResult.runtimeError);
      }

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.action).toBe('transferToPerp');
    });

    it('should verify the perp balance increased by the transfer amount', async () => {
      // Get perp balance after transfer
      const clearinghouseState = await infoClient.clearinghouseState({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      expect(clearinghouseState).toBeDefined();
      console.log(
        '[Perps] Clearinghouse state after transfer',
        util.inspect(clearinghouseState, { depth: 10 }),
      );

      // Verify the balance increased
      if ('marginSummary' in clearinghouseState && clearinghouseState.marginSummary) {
        const marginSummary = clearinghouseState.marginSummary as {
          accountValue?: string;
          totalMarginUsed?: string;
          totalNtlPos?: string;
          totalRawUsd?: string;
          withdrawable?: string;
        };
        const finalPerpBalance = marginSummary.accountValue || marginSummary.totalRawUsd || '0';

        console.log('[Perps] Initial balance:', initialPerpBalance);
        console.log('[Perps] Final balance:', finalPerpBalance);
        console.log('[Perps] Expected increase:', expectedTransferAmount);
        console.log(
          '[Perps] Actual increase:',
          parseFloat(finalPerpBalance) - parseFloat(initialPerpBalance),
        );

        // Verify the balance increased by the expected amount (with small tolerance for rounding)
        const actualIncrease = parseFloat(finalPerpBalance) - parseFloat(initialPerpBalance);
        expect(actualIncrease).toBeCloseTo(expectedTransferAmount, 6);
        expect(parseFloat(finalPerpBalance)).toBeGreaterThan(parseFloat(initialPerpBalance));
      } else {
        throw new Error('Unable to fetch final perp balance');
      }
    });
  });
});
