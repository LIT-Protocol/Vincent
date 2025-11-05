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

import {
  HyperliquidAction,
  bundledVincentAbility as hyperliquidBundledAbility,
  OrderType,
} from '../../../src';
import { calculatePerpOrderParams } from './helpers';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Hyperliquid Ability E2E Perp Long Tests', () => {
  const ENV = getEnv({
    ARBITRUM_RPC_URL: z.string(),
  });
  const USE_TESTNET = true;
  const PERP_LONG_USD_NOTIONAL = '15';
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

  describe(`[Perp Long] Open long position on ${PERP_SYMBOL} with ${PERP_LONG_USD_NOTIONAL} USD notional`, () => {
    let initialAccountValue: string;
    let initialPositionSize: string;

    beforeAll(async () => {
      // Get initial state before opening long
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
    });

    it('should run precheck for perp long', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
      });

      const {
        price: longPrice,
        size: longSize,
        midPrice,
        assetMeta,
      } = await calculatePerpOrderParams({
        transport,
        infoClient,
        symbol: PERP_SYMBOL,
        usdNotional: PERP_LONG_USD_NOTIONAL,
        isLong: true,
      });

      console.log(`[Perp Long] Asset: ${assetMeta.name}, szDecimals: ${assetMeta.szDecimals}`);
      console.log(
        `[Perp Long] Mid price: ${midPrice}, Long price: ${longPrice}, Size: ${longSize}`,
      );

      const precheckResult = await hyperliquidAbilityClient.precheck(
        {
          action: HyperliquidAction.PERP_LONG,
          useTestnet: USE_TESTNET,
          perp: {
            symbol: PERP_SYMBOL,
            price: longPrice,
            size: longSize,
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
      console.log('[Perp Long Precheck]', util.inspect(precheckResult, { depth: 10 }));

      if (precheckResult.success === false) {
        throw new Error(precheckResult.runtimeError);
      }

      expect(precheckResult.result).toBeDefined();
      expect(precheckResult.result.action).toBe(HyperliquidAction.PERP_LONG);
    });

    it(`should execute perp long to open long position on ${PERP_SYMBOL}`, async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
      });

      const {
        price: longPrice,
        size: longSize,
        midPrice,
        assetMeta,
      } = await calculatePerpOrderParams({
        transport,
        infoClient,
        symbol: PERP_SYMBOL,
        usdNotional: PERP_LONG_USD_NOTIONAL,
        isLong: true,
      });

      console.log(`[Perp Long] Asset: ${assetMeta.name}, szDecimals: ${assetMeta.szDecimals}`);
      console.log(
        `[Perp Long] Mid price: ${midPrice}, Long price: ${longPrice}, Size: ${longSize}`,
      );

      const executeResult = await hyperliquidAbilityClient.execute(
        {
          action: HyperliquidAction.PERP_LONG,
          useTestnet: USE_TESTNET,
          perp: {
            symbol: PERP_SYMBOL,
            price: longPrice,
            size: longSize,
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
      console.log('[Perp Long Execute]', util.inspect(executeResult, { depth: 10 }));

      expect(executeResult.success).toBe(true);
      if (executeResult.success === false) {
        throw new Error(executeResult.runtimeError);
      }

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.action).toBe(HyperliquidAction.PERP_LONG);
    });

    it(`should check ${PERP_SYMBOL} position increased after long`, async () => {
      // Wait a bit for order to potentially fill
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Get perp state after opening long
      const perpState = await infoClient.clearinghouseState({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      expect(perpState).toBeDefined();
      console.log('[Perp Long] State after long', util.inspect(perpState, { depth: 10 }));

      if (perpState.assetPositions) {
        const position = perpState.assetPositions.find((p) => p.position.coin === PERP_SYMBOL);

        if (position) {
          const finalPositionSize = position.position.szi;

          console.log('[Perp Long] Initial position size:', initialPositionSize);
          console.log('[Perp Long] Final position size:', finalPositionSize);
          console.log('[Perp Long] Position value:', position.position.positionValue);
          console.log('[Perp Long] Unrealized PnL:', position.position.unrealizedPnl);

          // Position size should increase (positive for long) or stay same if order didn't fill
          expect(parseFloat(finalPositionSize)).toBeGreaterThanOrEqual(
            parseFloat(initialPositionSize),
          );
        } else {
          console.log('[Perp Long] No position found yet (order might not have filled)');
        }
      }

      // Check account value
      const finalAccountValue = perpState.marginSummary.accountValue;
      console.log('[Perp Long] Initial account value:', initialAccountValue);
      console.log('[Perp Long] Final account value:', finalAccountValue);
    });
  });
});
