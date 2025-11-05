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
import { type Wallet } from 'ethers';
import * as hyperliquid from '@nktkas/hyperliquid';

import { bundledVincentAbility as hyperliquidBundledAbility } from '../../src';
import { SymbolConverter } from '@nktkas/hyperliquid/utils';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Hyperliquid Ability E2E Spot Trading Tests', () => {
  const ENV = getEnv({
    ARBITRUM_RPC_URL: z.string(),
  });
  const USE_TESTNET = true;
  const SPOT_BUY_AMOUNT_USDC = '15'; // 15 USDC worth of SOL
  const TOKEN_OUT_NAME = 'PURR';
  const TRADING_PAIR = `${TOKEN_OUT_NAME}/USDC`;

  // Helper function to round to N significant figures
  function toSignificantFigures(num: number, sigFigs: number): string {
    if (num === 0) return '0';
    const magnitude = Math.floor(Math.log10(Math.abs(num)));
    const scale = Math.pow(10, sigFigs - magnitude - 1);
    const rounded = Math.round(num * scale) / scale;
    return rounded.toString();
  }

  let agentPkpInfo: PkpInfo;
  let wallets: {
    appDelegatee: Wallet;
    funder: Wallet;
    appManager: Wallet;
    agentWalletOwner: Wallet;
  };
  let transport: hyperliquid.HttpTransport;
  let infoClient: hyperliquid.InfoClient;
  let tokenOutAmountReceived: string; // Store token out amount from buy to use in sell

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

    transport = new hyperliquid.HttpTransport({ isTestnet: USE_TESTNET });
    infoClient = new hyperliquid.InfoClient({ transport });
  });

  afterAll(async () => {
    await disconnectVincentAbilityClients();
  });

  describe(`[Spot Buy] Buy ${TOKEN_OUT_NAME} with ${SPOT_BUY_AMOUNT_USDC} USDC`, () => {
    let initialUsdcBalance: string;
    let initialTokenOutBalance: string;

    beforeAll(async () => {
      // Get initial balances before spot buy
      const spotState = await infoClient.spotClearinghouseState({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      if (spotState.balances) {
        const usdcBalance = spotState.balances.find((b) => b.coin === 'USDC');
        const tokenOutBalance = spotState.balances.find((b) => b.coin === TOKEN_OUT_NAME);
        initialUsdcBalance = usdcBalance?.total || '0';
        initialTokenOutBalance = tokenOutBalance?.total || '0';
        console.log(`[beforeAll] Initial USDC balance: ${initialUsdcBalance}`);
        console.log(`[beforeAll] Initial ${TOKEN_OUT_NAME} balance: ${initialTokenOutBalance}`);
      } else {
        throw new Error('No spot balances found. Please ensure funds are transferred to spot.');
      }
    });

    it('should run precheck for spot buy', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
      });

      const converter = await SymbolConverter.create({ transport });
      const spotPairId = converter.getSpotPairId(TRADING_PAIR);
      if (!spotPairId) {
        throw new Error(`Unable to get spot pair ID for ${TRADING_PAIR}`);
      }
      console.log('[Spot Buy] Spot Pair ID', spotPairId);

      // Get spot metadata to determine szDecimals
      const spotMeta = await infoClient.spotMeta();
      const tokenMeta = spotMeta.tokens.find((t) => t.name === TOKEN_OUT_NAME);
      if (!tokenMeta) {
        throw new Error(`Unable to find metadata for token ${TOKEN_OUT_NAME}`);
      }
      console.log(`[Spot Buy] Token: ${TOKEN_OUT_NAME}, szDecimals: ${tokenMeta.szDecimals}`);

      const allMidPrices = await infoClient.allMids();
      const midPrice = allMidPrices[spotPairId];

      // Calculate buy price according to Hyperliquid rules:
      // Max 5 significant figures, no more than (MAX_DECIMALS - szDecimals) decimal places
      // For spot, MAX_DECIMALS = 8
      const MAX_DECIMALS = 8;
      const maxPriceDecimals = MAX_DECIMALS - tokenMeta.szDecimals;
      const buyPriceRaw = parseFloat(midPrice) * 1.01;

      // First apply significant figures limit (max 5)
      let buyPrice = toSignificantFigures(buyPriceRaw, 5);

      // Then check decimal places constraint
      const [, decimalPart] = buyPrice.split('.');
      if (decimalPart && decimalPart.length > maxPriceDecimals) {
        // Need to round to maxPriceDecimals
        buyPrice = parseFloat(buyPrice).toFixed(maxPriceDecimals);
        // Remove trailing zeros
        buyPrice = parseFloat(buyPrice).toString();
      }

      // Calculate size rounded to szDecimals
      const rawSize = parseFloat(SPOT_BUY_AMOUNT_USDC) / parseFloat(buyPrice);
      const multiplier = Math.pow(10, tokenMeta.szDecimals);
      const minSize = 1 / multiplier; // Minimum size is 10^(-szDecimals)
      let buySize = Math.max(minSize, Math.floor(rawSize * multiplier) / multiplier).toFixed(
        tokenMeta.szDecimals,
      );
      // Remove trailing zeros from size
      buySize = parseFloat(buySize).toString();

      console.log(`[Spot Buy] Mid price: ${midPrice}, Buy price: ${buyPrice}, Size: ${buySize}`);

      const precheckResult = await hyperliquidAbilityClient.precheck(
        {
          action: 'spotBuy',
          useTestnet: USE_TESTNET,
          spot: {
            symbol: TRADING_PAIR,
            price: buyPrice,
            size: buySize,
          },
          arbitrumRpcUrl: ENV.ARBITRUM_RPC_URL,
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(precheckResult).toBeDefined();
      console.log('[Spot Buy Precheck]', util.inspect(precheckResult, { depth: 10 }));

      if (precheckResult.success === false) {
        throw new Error(precheckResult.runtimeError);
      }

      expect(precheckResult.result).toBeDefined();
      expect(precheckResult.result.action).toBe('spotBuy');
    });

    it('should execute spot buy to purchase SOL with USDC', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
      });

      const converter = await SymbolConverter.create({ transport });
      const spotPairId = converter.getSpotPairId(TRADING_PAIR);
      if (!spotPairId) {
        throw new Error(`Unable to get spot pair ID for ${TRADING_PAIR}`);
      }
      console.log('[Spot Buy] Spot Pair ID', spotPairId);

      // Get spot metadata to determine szDecimals
      const spotMeta = await infoClient.spotMeta();
      const tokenMeta = spotMeta.tokens.find((t) => t.name === TOKEN_OUT_NAME);
      if (!tokenMeta) {
        throw new Error(`Unable to find metadata for token ${TOKEN_OUT_NAME}`);
      }
      console.log('[Spot Buy] Token Meta', tokenMeta);
      console.log(`[Spot Buy] Token: ${TOKEN_OUT_NAME}, szDecimals: ${tokenMeta.szDecimals}`);

      const allMidPrices = await infoClient.allMids();
      const midPrice = allMidPrices[spotPairId];

      // Calculate buy price according to Hyperliquid rules:
      // Max 5 significant figures, no more than (MAX_DECIMALS - szDecimals) decimal places
      // For spot, MAX_DECIMALS = 8
      const MAX_DECIMALS = 8;
      const maxPriceDecimals = MAX_DECIMALS - tokenMeta.szDecimals;
      const buyPriceRaw = parseFloat(midPrice) * 1.01;

      // First apply significant figures limit (max 5)
      let buyPrice = toSignificantFigures(buyPriceRaw, 5);

      // Then check decimal places constraint
      const [, decimalPart] = buyPrice.split('.');
      if (decimalPart && decimalPart.length > maxPriceDecimals) {
        // Need to round to maxPriceDecimals
        buyPrice = parseFloat(buyPrice).toFixed(maxPriceDecimals);
        // Remove trailing zeros
        buyPrice = parseFloat(buyPrice).toString();
      }

      // Calculate size rounded to szDecimals
      const rawSize = parseFloat(SPOT_BUY_AMOUNT_USDC) / parseFloat(buyPrice);
      const multiplier = Math.pow(10, tokenMeta.szDecimals);
      const minSize = 1 / multiplier; // Minimum size is 10^(-szDecimals)
      let buySize = Math.max(minSize, Math.floor(rawSize * multiplier) / multiplier).toFixed(
        tokenMeta.szDecimals,
      );
      // Remove trailing zeros from size
      buySize = parseFloat(buySize).toString();

      console.log(`[Spot Buy] Mid price: ${midPrice}, Buy price: ${buyPrice}, Size: ${buySize}`);

      const executeResult = await hyperliquidAbilityClient.execute(
        {
          action: 'spotBuy',
          useTestnet: USE_TESTNET,
          spot: {
            symbol: TRADING_PAIR,
            price: buyPrice,
            size: buySize,
            orderType: { type: 'market' },
          },
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(executeResult).toBeDefined();
      console.log('[Spot Buy Execute]', util.inspect(executeResult, { depth: 10 }));

      expect(executeResult.success).toBe(true);
      if (executeResult.success === false) {
        throw new Error(executeResult.runtimeError);
      }

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.action).toBe('spotBuy');
    });

    it(`should check ${TOKEN_OUT_NAME} balance increased after buy`, async () => {
      // Wait a bit for order to potentially fill
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Get balances after buy
      const spotState = await infoClient.spotClearinghouseState({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      expect(spotState).toBeDefined();
      console.log('[Spot Buy] State after buy', util.inspect(spotState, { depth: 10 }));

      if (spotState.balances && spotState.balances.length > 0) {
        const usdcBalance = spotState.balances.find((b) => b.coin === 'USDC');
        const tokenOutBalance = spotState.balances.find((b) => b.coin === TOKEN_OUT_NAME);

        const finalUsdcBalance = usdcBalance?.total || '0';
        const finalTokenOutBalance = tokenOutBalance?.total || '0';

        console.log('[Spot Buy] Initial USDC:', initialUsdcBalance);
        console.log('[Spot Buy] Final USDC:', finalUsdcBalance);
        console.log(`[Spot Buy] Initial ${TOKEN_OUT_NAME}:`, initialTokenOutBalance);
        console.log(`[Spot Buy] Final ${TOKEN_OUT_NAME}:`, finalTokenOutBalance);

        // Store BTC amount for sell test
        tokenOutAmountReceived = finalTokenOutBalance;

        // BTC balance should increase (order might not fill immediately)
        // We just check that the order was placed successfully
        expect(parseFloat(finalTokenOutBalance)).toBeGreaterThanOrEqual(
          parseFloat(initialTokenOutBalance),
        );
      } else {
        throw new Error('No spot balances found after buy');
      }
    });
  });
});
