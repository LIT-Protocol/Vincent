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
  HyperliquidAction,
  bundledVincentAbility as hyperliquidBundledAbility,
  OrderType,
  HYPERLIQUID_BUILDER_ADDRESS,
} from '../../../src';
import { calculatePerpOrderParams } from './helpers';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Hyperliquid Ability E2E Perp Short Tests', () => {
  const ENV = getEnv({
    ARBITRUM_RPC_URL: z.string(),
  });
  const USE_TESTNET = true;
  const PERP_SHORT_USD_NOTIONAL = '15'; // $15 notional value of SOL
  const PERP_SYMBOL = 'SOL'; // Perp symbol (base asset only)
  const LEVERAGE = 2; // 2x leverage
  const IS_CROSS = true; // Cross margin

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

  describe(`[Perp Short] Open short position on ${PERP_SYMBOL} with ${PERP_SHORT_USD_NOTIONAL} USD notional`, () => {
    let initialAccountValue: string;
    let initialPositionSize: string;
    let initialBuilderRewards: string;

    beforeAll(async () => {
      // Get initial state before opening short
      const perpState = await infoClient.clearinghouseState({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      if (perpState) {
        initialAccountValue = perpState.marginSummary.accountValue;

        // Check if there's an existing position for this symbol
        const existingPosition = perpState.assetPositions.find(
          (p) => p.position.coin === PERP_SYMBOL,
        );
        initialPositionSize = existingPosition?.position.szi || '0';

        console.log(`[beforeAll] Initial account value: ${initialAccountValue}`);
        console.log(`[beforeAll] Initial ${PERP_SYMBOL} position size: ${initialPositionSize}`);
      } else {
        throw new Error(
          'No perp state found. Please ensure funds are transferred to perp account.',
        );
      }

      // Get initial builder rewards before perp short
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

    it('should run precheck for perp short', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: false,
      });

      const {
        price: shortPrice,
        size: shortSize,
        midPrice,
        assetMeta,
      } = await calculatePerpOrderParams({
        transport,
        infoClient,
        symbol: PERP_SYMBOL,
        usdNotional: PERP_SHORT_USD_NOTIONAL,
        isLong: false,
      });

      console.log(`[Perp Short] Asset: ${assetMeta.name}, szDecimals: ${assetMeta.szDecimals}`);
      console.log(
        `[Perp Short] Mid price: ${midPrice}, Short price: ${shortPrice}, Size: ${shortSize}`,
      );

      const precheckResult = await hyperliquidAbilityClient.precheck(
        {
          action: HyperliquidAction.PERP_SHORT,
          useTestnet: USE_TESTNET,
          perp: {
            symbol: PERP_SYMBOL,
            price: shortPrice,
            size: shortSize,
            leverage: LEVERAGE,
            isCross: IS_CROSS,
          },
          arbitrumRpcUrl: ENV.ARBITRUM_RPC_URL,
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(precheckResult).toBeDefined();
      console.log('[Perp Short Precheck]', util.inspect(precheckResult, { depth: 10 }));

      if (precheckResult.success === false) {
        throw new Error(precheckResult.runtimeError);
      }

      expect(precheckResult.result).toBeDefined();
      expect(precheckResult.result.action).toBe(HyperliquidAction.PERP_SHORT);
    });

    it(`should execute perp short to open short position on ${PERP_SYMBOL}`, async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: false,
      });

      const {
        price: shortPrice,
        size: shortSize,
        midPrice,
        assetMeta,
      } = await calculatePerpOrderParams({
        transport,
        infoClient,
        symbol: PERP_SYMBOL,
        usdNotional: PERP_SHORT_USD_NOTIONAL,
        isLong: false,
      });

      console.log(`[Perp Short] Asset: ${assetMeta.name}, szDecimals: ${assetMeta.szDecimals}`);
      console.log(
        `[Perp Short] Mid price: ${midPrice}, Short price: ${shortPrice}, Size: ${shortSize}`,
      );

      const executeResult = await hyperliquidAbilityClient.execute(
        {
          action: HyperliquidAction.PERP_SHORT,
          useTestnet: USE_TESTNET,
          perp: {
            symbol: PERP_SYMBOL,
            price: shortPrice,
            size: shortSize,
            leverage: LEVERAGE,
            isCross: IS_CROSS,
            reduceOnly: true,
            orderType: { type: OrderType.MARKET },
          },
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(executeResult).toBeDefined();
      console.log('[Perp Short Execute]', util.inspect(executeResult, { depth: 10 }));

      expect(executeResult.success).toBe(true);
      if (executeResult.success === false) {
        throw new Error(executeResult.runtimeError);
      }

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.action).toBe(HyperliquidAction.PERP_SHORT);
    });

    it(`should check ${PERP_SYMBOL} position decreased (became more negative) after short`, async () => {
      // Wait a bit for order to potentially fill
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Get perp state after opening short
      const perpState = await infoClient.clearinghouseState({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      expect(perpState).toBeDefined();
      console.log('[Perp Short] State after short', util.inspect(perpState, { depth: 10 }));

      if (perpState.assetPositions) {
        const position = perpState.assetPositions.find((p) => p.position.coin === PERP_SYMBOL);

        if (position) {
          const finalPositionSize = position.position.szi;

          console.log('[Perp Short] Initial position size:', initialPositionSize);
          console.log('[Perp Short] Final position size:', finalPositionSize);
          console.log('[Perp Short] Position value:', position.position.positionValue);
          console.log('[Perp Short] Unrealized PnL:', position.position.unrealizedPnl);

          // Position size should decrease (become more negative for short) or stay same if order didn't fill
          expect(parseFloat(finalPositionSize)).toBeLessThanOrEqual(
            parseFloat(initialPositionSize),
          );
        } else {
          console.log('[Perp Short] No position found yet (order might not have filled)');
        }
      }

      // Check account value
      const finalAccountValue = perpState.marginSummary.accountValue;
      console.log('[Perp Short] Initial account value:', initialAccountValue);
      console.log('[Perp Short] Final account value:', finalAccountValue);
    });

    it('should validate builder rewards increased after perp short', async () => {
      // Wait a bit for order to fill and builder rewards to be credited
      // Builder rewards are processed onchain, so we need to wait for the transaction to be processed
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Get referral data after short
      const referralData = await infoClient.referral({
        user: HYPERLIQUID_BUILDER_ADDRESS,
      });

      expect(referralData).toBeDefined();
      console.log(
        '[Perp Short] Referral data after short:',
        util.inspect(referralData, { depth: 10 }),
      );

      const finalBuilderRewards = referralData.builderRewards || '0';

      console.log('[Perp Short] Initial builder rewards:', initialBuilderRewards);
      console.log('[Perp Short] Final builder rewards:', finalBuilderRewards);

      // Builder rewards should increase after a perp short (since builder codes apply to perp orders)
      expect(parseFloat(finalBuilderRewards)).toBeGreaterThan(parseFloat(initialBuilderRewards));

      // If builder rewards increased, log the difference
      const rewardIncrease = parseFloat(finalBuilderRewards) - parseFloat(initialBuilderRewards);
      console.log(`[Perp Long] Builder rewards increased by: ${rewardIncrease}`);
    });
  });
});
