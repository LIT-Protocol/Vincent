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
import { ethers, type Wallet, type providers } from 'ethers';
import * as hyperliquid from '@nktkas/hyperliquid';
import { ERC20_ABI } from '@lit-protocol/vincent-ability-sdk';

import { bundledVincentAbility as hyperliquidBundledAbility } from '../../src';

// USDC contract addresses on Arbitrum
const ARBITRUM_USDC_ADDRESS_MAINNET = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const ARBITRUM_USDC_ADDRESS_TESTNET = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Hyperliquid Ability E2E Balance Tests', () => {
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
  let arbitrumRpcProvider: providers.JsonRpcProvider;

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
    arbitrumRpcProvider = new ethers.providers.JsonRpcProvider(ENV.ARBITRUM_RPC_URL);
  });

  afterAll(async () => {
    await disconnectVincentAbilityClients();
  });

  describe('Fetch Spot and Perp Balances', () => {
    it('should fetch the spot balance of the agent wallet PKP ETH address', async () => {
      const spotState = await infoClient.spotClearinghouseState({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      expect(spotState).toBeDefined();
      console.log('[Spot Balance] Agent Wallet PKP ETH Address:', agentPkpInfo.ethAddress);
      console.log('[Spot Balance] Full spot state:', util.inspect(spotState, { depth: 10 }));

      if (spotState.balances && spotState.balances.length > 0) {
        console.log('[Spot Balance] Balances:');
        spotState.balances.forEach((balance) => {
          console.log(`  ${balance.coin}: total=${balance.total}, hold=${balance.hold}`);
        });

        // Check for USDC balance specifically
        const usdcBalance = spotState.balances.find((b) => b.coin === 'USDC');
        if (usdcBalance) {
          console.log('[Spot Balance] USDC Balance:', usdcBalance.total);
          expect(usdcBalance.total).toBeDefined();
        }
      } else {
        console.log('[Spot Balance] No spot balances found');
      }
    });

    it('should fetch the perpetual balance of the agent wallet PKP ETH address', async () => {
      const perpState = await infoClient.clearinghouseState({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      expect(perpState).toBeDefined();
      console.log('[Perp Balance] Agent Wallet PKP ETH Address:', agentPkpInfo.ethAddress);
      console.log('[Perp Balance] Full perp state:', util.inspect(perpState, { depth: 10 }));

      // Check margin summary
      if (perpState.marginSummary) {
        console.log('[Perp Balance] Margin Summary:');
        console.log(`  Account Value: ${perpState.marginSummary.accountValue}`);
        console.log(`  Total Margin Used: ${perpState.marginSummary.totalMarginUsed}`);
        console.log(`  Total NTL Position: ${perpState.marginSummary.totalNtlPos}`);
        console.log(`  Total Raw USD: ${perpState.marginSummary.totalRawUsd}`);

        expect(perpState.marginSummary.accountValue).toBeDefined();
      }

      // Check asset positions
      if (perpState.assetPositions && perpState.assetPositions.length > 0) {
        console.log('[Perp Balance] Asset Positions:');
        perpState.assetPositions.forEach((assetPosition) => {
          const pos = assetPosition.position;
          console.log(`  ${pos.coin}:`);
          console.log(`    Position Size (szi): ${pos.szi}`);
          console.log(`    Position Value: ${pos.positionValue}`);
          console.log(`    Unrealized PnL: ${pos.unrealizedPnl}`);
          console.log(`    Entry Price: ${pos.entryPx || 'N/A'}`);
        });
      } else {
        console.log('[Perp Balance] No open perp positions found');
      }

      // Check if there's any cross margin summary
      if (perpState.crossMarginSummary) {
        console.log('[Perp Balance] Cross Margin Summary:');
        console.log(`  Account Value: ${perpState.crossMarginSummary.accountValue}`);
        console.log(`  Total Margin Used: ${perpState.crossMarginSummary.totalMarginUsed}`);
      }
    });
  });

  describe('Fetch Arbitrum Balances', () => {
    it('should fetch the Arbitrum ETH balance of the agent wallet PKP ETH address', async () => {
      const ethBalance = await arbitrumRpcProvider.getBalance(agentPkpInfo.ethAddress);

      expect(ethBalance).toBeDefined();
      console.log('[Arbitrum ETH Balance] Agent Wallet PKP ETH Address:', agentPkpInfo.ethAddress);
      console.log('[Arbitrum ETH Balance] Raw balance (wei):', ethBalance.toString());
      console.log(
        '[Arbitrum ETH Balance] Formatted balance (ETH):',
        ethers.utils.formatEther(ethBalance),
      );
    });

    it('should fetch the Arbitrum USDC balance of the agent wallet PKP ETH address', async () => {
      const usdcAddress = USE_TESTNET
        ? ARBITRUM_USDC_ADDRESS_TESTNET
        : ARBITRUM_USDC_ADDRESS_MAINNET;

      console.log(
        `[Arbitrum USDC Balance] Using ${USE_TESTNET ? 'testnet' : 'mainnet'} USDC address:`,
        usdcAddress,
      );

      const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, arbitrumRpcProvider);
      const usdcBalance = await usdcContract.balanceOf(agentPkpInfo.ethAddress);

      console.log('[Arbitrum USDC Balance] Agent Wallet PKP ETH Address:', agentPkpInfo.ethAddress);
      console.log('[Arbitrum USDC Balance] Raw balance:', usdcBalance.toString());
      console.log(
        '[Arbitrum USDC Balance] Formatted balance (USDC):',
        ethers.utils.formatUnits(usdcBalance, 6),
      );
    });
  });
});
