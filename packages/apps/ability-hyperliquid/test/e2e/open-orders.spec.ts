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
import { disconnectVincentAbilityClients } from '@lit-protocol/vincent-app-sdk/abilityClient';
import * as util from 'node:util';
import { z } from 'zod';
import { type Wallet } from 'ethers';
import * as hyperliquid from '@nktkas/hyperliquid';

import { bundledVincentAbility as hyperliquidBundledAbility } from '../../src';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Hyperliquid Ability E2E Open Orders Tests', () => {
  const ENV = getEnv({
    ARBITRUM_RPC_URL: z.string(),
  });
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

    transport = new hyperliquid.HttpTransport({ isTestnet: USE_TESTNET });
    infoClient = new hyperliquid.InfoClient({ transport });
  });

  afterAll(async () => {
    await disconnectVincentAbilityClients();
  });

  describe('Fetch Open Orders', () => {
    it('should fetch all open orders (spot and perp) for the agent wallet PKP ETH address', async () => {
      const openOrders = await infoClient.openOrders({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      expect(openOrders).toBeDefined();
      console.log('[Open Orders] Agent Wallet PKP ETH Address:', agentPkpInfo.ethAddress);
      console.log(
        '[Open Orders] Full open orders response:',
        util.inspect(openOrders, { depth: 10 }),
      );

      if (openOrders && openOrders.length > 0) {
        console.log(`[Open Orders] Found ${openOrders.length} open order(s)`);
      } else {
        console.log('[Open Orders] No open orders found');
      }
    });

    it('should fetch open spot orders for the agent wallet PKP ETH address', async () => {
      // Get all open orders first
      const allOpenOrders = await infoClient.openOrders({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      // Get spot metadata to identify spot trading pairs
      const spotMeta = await infoClient.spotMeta();
      const spotTokens = new Set(spotMeta.tokens.map((t) => t.name));
      const spotUniverse = spotMeta.universe.map((pair) => pair.name);

      console.log('[Spot Open Orders] Agent Wallet PKP ETH Address:', agentPkpInfo.ethAddress);

      if (allOpenOrders && allOpenOrders.length > 0) {
        // Filter for spot orders - orders where the coin is in the spot universe
        const spotOrders = allOpenOrders.filter((order) => {
          // Check if this is a spot trading pair (e.g., "PURR/USDC")
          return spotUniverse.some((pair) => pair.includes(order.coin));
        });

        if (spotOrders.length > 0) {
          console.log(`[Spot Open Orders] Found ${spotOrders.length} open spot order(s)`);
          console.log(
            '[Spot Open Orders] Full spot orders:',
            util.inspect(spotOrders, { depth: 10 }),
          );
        } else {
          console.log('[Spot Open Orders] No open spot orders found');
        }
      } else {
        console.log('[Spot Open Orders] No open orders found');
      }
    });

    it('should fetch open perp orders for the agent wallet PKP ETH address', async () => {
      // Get all open orders first
      const allOpenOrders = await infoClient.openOrders({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      // Get perp metadata to identify perp trading symbols
      const perpMeta = await infoClient.meta();
      const perpUniverse = perpMeta.universe.map((asset) => asset.name);

      console.log('[Perp Open Orders] Agent Wallet PKP ETH Address:', agentPkpInfo.ethAddress);

      if (allOpenOrders && allOpenOrders.length > 0) {
        // Filter for perp orders - orders where the coin is in the perp universe
        const perpOrders = allOpenOrders.filter((order) => {
          // Perp orders use just the coin name (e.g., "BTC", "ETH", "SOL")
          return perpUniverse.includes(order.coin);
        });

        if (perpOrders.length > 0) {
          console.log(`[Perp Open Orders] Found ${perpOrders.length} open perp order(s)`);
          console.log(
            '[Perp Open Orders] Full perp orders:',
            util.inspect(perpOrders, { depth: 10 }),
          );
        } else {
          console.log('[Perp Open Orders] No open perp orders found');
        }
      } else {
        console.log('[Perp Open Orders] No open orders found');
      }
    });
  });
});
