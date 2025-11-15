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
  const USDC_TRANSFER_AMOUNT = '50000000'; // 15 USDC
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

  describe('[Transfer to Spot] Precheck & Execute Swap Success', () => {
    let initialSpotBalance: string;
    const expectedTransferAmount = parseFloat(USDC_TRANSFER_AMOUNT) / 1_000_000; // Convert from micro-units to whole USDC

    beforeAll(async () => {
      // Get initial spot balance before transfer
      const spotState = await infoClient.spotClearinghouseState({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      if (spotState.balances) {
        const usdcBalance = spotState.balances.find((b) => b.coin === 'USDC');
        initialSpotBalance = usdcBalance?.total || '0';
        console.log('[beforeAll] Initial spot USDC balance:', initialSpotBalance);
      } else {
        initialSpotBalance = '0';
        console.log('[beforeAll] No initial spot balance found, starting at 0');
      }
    });

    it('should execute the HyperLiquid Ability precheck method for transfer to spot', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: false,
      });

      const precheckResult = await hyperliquidAbilityClient.precheck(
        {
          action: 'transferToSpot',
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
        '[should successfully run precheck on the Hyperliquid Ability for transfer to spot]',
        util.inspect(precheckResult, { depth: 10 }),
      );

      if (precheckResult.success === false) {
        throw new Error(precheckResult.runtimeError);
      }

      expect(precheckResult.result).toBeDefined();
      expect(precheckResult.result.action).toBe('transferToSpot');
      expect(parseFloat(precheckResult.result.availableBalance as string)).toBeGreaterThan(0);
    });

    it('should execute the Hyperliquid Ability to make a transfer to spot from the Agent Wallet PKP', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: false,
      });

      const executeResult = await hyperliquidAbilityClient.execute(
        {
          action: 'transferToSpot',
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

    it('should verify the spot balance increased by the transfer amount', async () => {
      // Get spot balance after transfer
      const spotState = await infoClient.spotClearinghouseState({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      expect(spotState).toBeDefined();
      console.log(
        '[Spot] Clearinghouse state after transfer',
        util.inspect(spotState, { depth: 10 }),
      );

      // Verify spot balances exist
      expect(spotState.balances).toBeDefined();
      expect(Array.isArray(spotState.balances)).toBe(true);

      if (spotState.balances.length > 0) {
        console.log(`[Spot] Found ${spotState.balances.length} token balance(s):`);
        spotState.balances.forEach((balance) => {
          const available = parseFloat(balance.total) - parseFloat(balance.hold);
          console.log(
            `  - ${balance.coin}: total=${balance.total}, hold=${balance.hold}, available=${available.toFixed(6)}`,
          );
        });

        // Check if we have USDC balance
        const usdcBalance = spotState.balances.find((b) => b.coin === 'USDC');
        if (usdcBalance) {
          const finalSpotBalance = usdcBalance.total;

          console.log('[Spot] Initial balance:', initialSpotBalance);
          console.log('[Spot] Final balance:', finalSpotBalance);
          console.log('[Spot] Expected increase:', expectedTransferAmount);
          console.log(
            '[Spot] Actual increase:',
            parseFloat(finalSpotBalance) - parseFloat(initialSpotBalance),
          );

          // Verify the balance increased by the expected amount (with small tolerance for rounding)
          const actualIncrease = parseFloat(finalSpotBalance) - parseFloat(initialSpotBalance);
          expect(actualIncrease).toBeCloseTo(expectedTransferAmount, 6);
          expect(parseFloat(finalSpotBalance)).toBeGreaterThan(parseFloat(initialSpotBalance));
        } else {
          throw new Error('USDC balance not found after transfer');
        }
      } else {
        throw new Error('No spot balances found after transfer');
      }
    });
  });
});
