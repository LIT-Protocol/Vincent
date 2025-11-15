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
} from '../../../src';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Hyperliquid Ability E2E Spot Cancel Order Tests', () => {
  const ENV = getEnv({
    ARBITRUM_RPC_URL: z.string(),
  });
  const USE_TESTNET = true;

  // CONFIGURE THESE BEFORE RUNNING THE TEST
  const TRADING_PAIR = 'PURR/USDC'; // Trading pair for the order to cancel
  const ORDER_ID_TO_CANCEL = 0; // Replace with actual order ID from a placed order

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
    if (ORDER_ID_TO_CANCEL === 0) {
      throw new Error('Please set ORDER_ID_TO_CANCEL to a valid order ID before running this test');
    }

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

  describe('[Spot Cancel Order] Cancel a specific order', () => {
    it('should execute precheck for cancel order', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: false,
      });

      const precheckResult = await hyperliquidAbilityClient.precheck(
        {
          action: HyperliquidAction.CANCEL_ORDER,
          useTestnet: USE_TESTNET,
          cancelOrder: {
            symbol: TRADING_PAIR,
            orderId: ORDER_ID_TO_CANCEL,
          },
          arbitrumRpcUrl: ENV.ARBITRUM_RPC_URL,
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(precheckResult).toBeDefined();
      console.log(
        '[Spot Cancel Order] precheckResult',
        util.inspect(precheckResult, { depth: 10 }),
      );

      if (precheckResult.success === false) {
        throw new Error(precheckResult.runtimeError);
      }

      expect(precheckResult.result).toBeDefined();
      expect(precheckResult.result.action).toBe(HyperliquidAction.CANCEL_ORDER);
    });

    it('should run execute to cancel order', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: false,
      });

      const executeResult = await hyperliquidAbilityClient.execute(
        {
          action: HyperliquidAction.CANCEL_ORDER,
          useTestnet: USE_TESTNET,
          cancelOrder: {
            symbol: TRADING_PAIR,
            orderId: ORDER_ID_TO_CANCEL,
          },
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(executeResult).toBeDefined();
      console.log(
        '[should run execute to cancel order] executeResult',
        util.inspect(executeResult, { depth: 10 }),
      );

      expect(executeResult.success).toBe(true);
      if (executeResult.success === false) {
        throw new Error(executeResult.runtimeError);
      }

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.action).toBe(HyperliquidAction.CANCEL_ORDER);
      expect(executeResult.result.cancelResult).toBeDefined();
    });

    it('should verify order is no longer in open orders', async () => {
      // Wait a bit for cancellation to be reflected
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const openOrders = await infoClient.openOrders({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      console.log(
        '[should verify order is no longer in open orders] Open orders after cancel:',
        util.inspect(openOrders, { depth: 5 }),
      );

      const order = openOrders.find((o) => o.oid === ORDER_ID_TO_CANCEL);
      expect(order).toBeUndefined();
    });
  });
});
