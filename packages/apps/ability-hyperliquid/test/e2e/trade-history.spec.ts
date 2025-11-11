import {
  delegator,
  delegatee,
  funder,
  appManager,
  ensureUnexpiredCapacityToken,
  getChainHelpers,
  type PkpInfo,
} from '@lit-protocol/vincent-e2e-test-utils';
import { type PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import { disconnectVincentAbilityClients } from '@lit-protocol/vincent-app-sdk/abilityClient';
import * as util from 'node:util';
import { type Wallet } from 'ethers';
import * as hyperliquid from '@nktkas/hyperliquid';

import { bundledVincentAbility as hyperliquidBundledAbility } from '../../src';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Hyperliquid Ability E2E Trade History Tests', () => {
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

  describe('Fetch Trade History', () => {
    it('should fetch recent user fills (trade history) for the agent wallet PKP ETH address', async () => {
      const userFills = await infoClient.userFills({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      expect(userFills).toBeDefined();
      console.log('[Trade History] Agent Wallet PKP ETH Address:', agentPkpInfo.ethAddress);
      console.log(
        '[Trade History] Full user fills response:',
        util.inspect(userFills, { depth: 10 }),
      );
    });

    it('should fetch user funding history for the agent wallet PKP ETH address', async () => {
      try {
        const fundingHistory = await infoClient.userFunding({
          user: agentPkpInfo.ethAddress as `0x${string}`,
          startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
        });

        expect(fundingHistory).toBeDefined();
        console.log('[Funding History] Agent Wallet PKP ETH Address:', agentPkpInfo.ethAddress);
        console.log(
          '[Funding History] Full funding history:',
          util.inspect(fundingHistory, { depth: 10 }),
        );
      } catch (error) {
        console.log('[Funding History] Error fetching funding history:', error);
      }
    });

    it('should fetch user non-funding ledger updates for the agent wallet PKP ETH address', async () => {
      try {
        const ledgerUpdates = await infoClient.userNonFundingLedgerUpdates({
          user: agentPkpInfo.ethAddress as `0x${string}`,
          startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
        });

        expect(ledgerUpdates).toBeDefined();
        console.log('[Ledger Updates] Agent Wallet PKP ETH Address:', agentPkpInfo.ethAddress);
        console.log(
          '[Ledger Updates] Full ledger updates:',
          util.inspect(ledgerUpdates, { depth: 10 }),
        );
      } catch (error) {
        console.log('[Ledger Updates] Error fetching ledger updates:', error);
      }
    });
  });
});
