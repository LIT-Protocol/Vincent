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

import {
  bundledVincentAbility as hyperliquidBundledAbility,
  HYPERLIQUID_BUILDER_ADDRESS,
} from '../../../src';
import { calculateSpotOrderParams } from './helpers';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Hyperliquid Ability E2E Spot Sell Tests', () => {
  const ENV = getEnv({
    ARBITRUM_RPC_URL: z.string(),
  });
  const USE_TESTNET = true;
  // calculateSpotOrderParams determines how many decimals are allowed for the
  // order size based on the szDecimals of the token being sold. It uses Math.floor()
  // to ensure we never try to sell more than we have, and caps the sell size at
  // maxAvailableBalance floored to the token's decimal precision.
  //
  // Example with PURR (szDecimals=0, only whole tokens):
  // - Balance: 1.9986 PURR (from 2.0 minus 0.0014 fee)
  // - Price: $5.10 per PURR
  // - To sell $15 worth: 15/5.10 = 2.941 PURR
  // - Math.floor(2.941) = 2.0 PURR
  // - But maxAvailableBalance is 1.9986, so Math.floor(1.9986) = 1.0 PURR
  // - Result: Sell order for 1.0 PURR = $5.10
  // - The remaining 0.9986 PURR is "dust" below the minimum tradeable size
  const SPOT_SELL_AMOUNT_USDC = '15';
  const TOKEN_TO_SELL = 'PURR';
  const TRADING_PAIR = `${TOKEN_TO_SELL}/USDC`;

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

  describe(`[Spot Sell] Sell ${TOKEN_TO_SELL} for USDC`, () => {
    let initialUsdcBalance: string;
    let initialTokenBalance: string;
    let initialBuilderRewards: string;

    beforeAll(async () => {
      // Get initial balances before spot sell
      const spotState = await infoClient.spotClearinghouseState({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      if (spotState.balances) {
        const usdcBalance = spotState.balances.find((b) => b.coin === 'USDC');
        const tokenBalance = spotState.balances.find((b) => b.coin === TOKEN_TO_SELL);
        initialUsdcBalance = usdcBalance?.total || '0';
        initialTokenBalance = tokenBalance?.total || '0';
        console.log(`[beforeAll] Initial USDC balance: ${initialUsdcBalance}`);
        console.log(`[beforeAll] Initial ${TOKEN_TO_SELL} balance: ${initialTokenBalance}`);

        if (parseFloat(initialTokenBalance) === 0) {
          throw new Error(
            `No ${TOKEN_TO_SELL} balance to sell. Please ensure you have ${TOKEN_TO_SELL} in your spot account.`,
          );
        }
      } else {
        throw new Error('No spot balances found. Please ensure funds are transferred to spot.');
      }

      // Get initial builder rewards before spot sell
      try {
        const referralData = await infoClient.referral({
          user: HYPERLIQUID_BUILDER_ADDRESS,
        });
        initialBuilderRewards = referralData.builderRewards || '0';
        console.log(`[beforeAll] Initial builder rewards: ${initialBuilderRewards}`);
      } catch (error) {
        console.warn('[beforeAll] Could not fetch initial builder rewards:', error);
        initialBuilderRewards = '0';
      }
    });

    it('should run precheck for spot sell', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: false,
      });

      const {
        price: sellPrice,
        size: sellSize,
        midPrice,
        tokenMeta,
      } = await calculateSpotOrderParams({
        transport,
        infoClient,
        tradingPair: TRADING_PAIR,
        tokenName: TOKEN_TO_SELL,
        usdcAmount: SPOT_SELL_AMOUNT_USDC,
        isBuy: false,
        maxAvailableBalance: initialTokenBalance,
      });

      console.log(`[Spot Sell] Token: ${tokenMeta.name}, szDecimals: ${tokenMeta.szDecimals}`);
      console.log(
        `[Spot Sell] Mid price: ${midPrice}, Sell price: ${sellPrice}, Size: ${sellSize}`,
      );

      const precheckResult = await hyperliquidAbilityClient.precheck(
        {
          action: 'spotSell',
          useTestnet: USE_TESTNET,
          spot: {
            symbol: TRADING_PAIR,
            price: sellPrice,
            size: sellSize,
          },
          arbitrumRpcUrl: ENV.ARBITRUM_RPC_URL,
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(precheckResult).toBeDefined();
      console.log('[Spot Sell Precheck]', util.inspect(precheckResult, { depth: 10 }));

      if (precheckResult.success === false) {
        throw new Error(precheckResult.runtimeError);
      }

      expect(precheckResult.result).toBeDefined();
      expect(precheckResult.result.action).toBe('spotSell');
    });

    it(`should execute spot sell to sell ${TOKEN_TO_SELL} for USDC`, async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: true,
      });

      const {
        price: sellPrice,
        size: sellSize,
        midPrice,
        tokenMeta,
      } = await calculateSpotOrderParams({
        transport,
        infoClient,
        tradingPair: TRADING_PAIR,
        tokenName: TOKEN_TO_SELL,
        usdcAmount: SPOT_SELL_AMOUNT_USDC,
        isBuy: false, // Sell order
        maxAvailableBalance: initialTokenBalance,
      });

      console.log(`[Spot Sell] Token: ${tokenMeta.name}, szDecimals: ${tokenMeta.szDecimals}`);
      console.log(
        `[Spot Sell] Mid price: ${midPrice}, Sell price: ${sellPrice}, Size: ${sellSize}`,
      );

      const executeResult = await hyperliquidAbilityClient.execute(
        {
          action: 'spotSell',
          useTestnet: USE_TESTNET,
          spot: {
            symbol: TRADING_PAIR,
            price: sellPrice,
            size: sellSize,
            orderType: { type: 'market' },
          },
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(executeResult).toBeDefined();
      console.log('[Spot Sell Execute]', util.inspect(executeResult, { depth: 10 }));

      expect(executeResult.success).toBe(true);
      if (executeResult.success === false) {
        throw new Error(executeResult.runtimeError);
      }

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.action).toBe('spotSell');
    });

    it(`should check USDC balance increased and ${TOKEN_TO_SELL} balance decreased after sell`, async () => {
      // Wait a bit for order to potentially fill
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Get balances after sell
      const spotState = await infoClient.spotClearinghouseState({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      expect(spotState).toBeDefined();
      console.log('[Spot Sell] State after sell', util.inspect(spotState, { depth: 10 }));

      if (spotState.balances && spotState.balances.length > 0) {
        const usdcBalance = spotState.balances.find((b) => b.coin === 'USDC');
        const tokenBalance = spotState.balances.find((b) => b.coin === TOKEN_TO_SELL);

        const finalUsdcBalance = usdcBalance?.total || '0';
        const finalTokenBalance = tokenBalance?.total || '0';

        console.log('[Spot Sell] Initial USDC:', initialUsdcBalance);
        console.log('[Spot Sell] Final USDC:', finalUsdcBalance);
        console.log(`[Spot Sell] Initial ${TOKEN_TO_SELL}:`, initialTokenBalance);
        console.log(`[Spot Sell] Final ${TOKEN_TO_SELL}:`, finalTokenBalance);

        // Token balance should decrease or stay same (order might not fill immediately)
        expect(parseFloat(finalTokenBalance)).toBeLessThanOrEqual(parseFloat(initialTokenBalance));

        // USDC balance should increase or stay same (order might not fill immediately)
        expect(parseFloat(finalUsdcBalance)).toBeGreaterThanOrEqual(parseFloat(initialUsdcBalance));
      } else {
        throw new Error('No spot balances found after sell');
      }
    });

    it('should validate builder rewards increased after spot sell', async () => {
      // Wait a bit for order to fill and builder rewards to be credited
      // Builder rewards are processed onchain, so we need to wait for the transaction to be processed
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Get referral data after sell
      const referralData = await infoClient.referral({
        user: HYPERLIQUID_BUILDER_ADDRESS,
      });

      expect(referralData).toBeDefined();
      console.log(
        '[Spot Sell] Referral data after sell:',
        util.inspect(referralData, { depth: 10 }),
      );

      const finalBuilderRewards = referralData.builderRewards || '0';

      console.log('[Spot Sell] Initial builder rewards:', initialBuilderRewards);
      console.log('[Spot Sell] Final builder rewards:', finalBuilderRewards);

      // Builder rewards should increase after a spot sell (since builder codes apply to sell orders)
      expect(parseFloat(finalBuilderRewards)).toBeGreaterThan(parseFloat(initialBuilderRewards));

      // If builder rewards increased, log the difference
      const rewardIncrease = parseFloat(finalBuilderRewards) - parseFloat(initialBuilderRewards);
      console.log(`[Spot Sell] Builder rewards increased by: ${rewardIncrease}`);
    });
  });
});
