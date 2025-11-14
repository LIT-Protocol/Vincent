import {
  delegator,
  delegatee,
  funder,
  appManager,
  ensureUnexpiredCapacityToken,
  getChainHelpers,
  type PkpInfo,
  setupVincentDevelopmentEnvironment,
} from '@lit-protocol/vincent-e2e-test-utils';
import { type PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import * as util from 'node:util';
import { type Wallet } from 'ethers';
import * as hyperliquid from '@nktkas/hyperliquid';

import {
  HyperliquidAction,
  bundledVincentAbility as hyperliquidBundledAbility,
  HYPERLIQUID_BUILDER_ADDRESS,
} from '../../src';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Hyperliquid Ability E2E Approve Builder Code Tests', () => {
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

  describe('[Approve Builder Code] Approve builder code for trading', () => {
    let initialBuilderApprovalStatus: boolean;

    beforeAll(async () => {
      // Check initial builder approval status
      try {
        const maxFee = await infoClient.maxBuilderFee({
          user: agentPkpInfo.ethAddress as `0x${string}`,
          builder: HYPERLIQUID_BUILDER_ADDRESS as `0x${string}`,
        });
        initialBuilderApprovalStatus = typeof maxFee === 'number' && maxFee > 0;
      } catch (error) {
        console.warn('[beforeAll] Could not fetch initial builder approval status:', error);
        initialBuilderApprovalStatus = false;
      }
      console.log(`[beforeAll] Initial builder approval status: ${initialBuilderApprovalStatus}`);
    });

    it('should run precheck for approve builder code', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: false,
      });

      const precheckResult = await hyperliquidAbilityClient.precheck(
        {
          action: HyperliquidAction.APPROVE_BUILDER_CODE,
          useTestnet: USE_TESTNET,
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(precheckResult).toBeDefined();
      console.log('[Approve Builder Code Precheck]', util.inspect(precheckResult, { depth: 10 }));

      if (precheckResult.success === false) {
        // If builder is already approved, precheck should fail with appropriate message
        if (initialBuilderApprovalStatus) {
          expect(precheckResult.result.reason).toContain('already approved');
          return;
        }
        throw new Error(precheckResult.runtimeError);
      }

      expect(precheckResult.result).toBeDefined();
      expect(precheckResult.result.action).toBe(HyperliquidAction.APPROVE_BUILDER_CODE);
    });

    it('should execute approve builder code', async () => {
      // Skip if builder is already approved
      if (initialBuilderApprovalStatus) {
        console.log(
          '[Approve Builder Code] Builder code is already approved, skipping execution test',
        );
        return;
      }

      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: false,
      });

      const executeResult = await hyperliquidAbilityClient.execute(
        {
          action: HyperliquidAction.APPROVE_BUILDER_CODE,
          useTestnet: USE_TESTNET,
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(executeResult).toBeDefined();
      console.log('[Approve Builder Code Execute]', util.inspect(executeResult, { depth: 10 }));

      expect(executeResult.success).toBe(true);
      if (executeResult.success === false) {
        throw new Error(executeResult.runtimeError);
      }

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.action).toBe(HyperliquidAction.APPROVE_BUILDER_CODE);
      expect(executeResult.result.approveResult).toBeDefined();
      expect(executeResult.result.approveResult.status).toBe('ok');
    });

    it('should verify builder code is approved after execution', async () => {
      // Wait a bit for approval to be processed
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check builder approval status after execution
      let finalBuilderApprovalStatus: boolean;
      try {
        const maxFee = await infoClient.maxBuilderFee({
          user: agentPkpInfo.ethAddress as `0x${string}`,
          builder: HYPERLIQUID_BUILDER_ADDRESS as `0x${string}`,
        });
        finalBuilderApprovalStatus = typeof maxFee === 'number' && maxFee > 0;
      } catch (error) {
        console.warn(
          '[Approve Builder Code] Could not fetch final builder approval status:',
          error,
        );
        finalBuilderApprovalStatus = false;
      }

      console.log(
        `[Approve Builder Code] Initial approval status: ${initialBuilderApprovalStatus}`,
      );
      console.log(`[Approve Builder Code] Final approval status: ${finalBuilderApprovalStatus}`);

      // If it wasn't approved initially, it should be approved now
      if (!initialBuilderApprovalStatus) {
        expect(finalBuilderApprovalStatus).toBe(true);
      } else {
        // If it was already approved, it should still be approved
        expect(finalBuilderApprovalStatus).toBe(true);
      }
    });
  });
});
