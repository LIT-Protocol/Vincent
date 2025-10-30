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

import {
  AbilityAction,
  bundledVincentAbility as aerodromeBundledAbility,
  type CheckErc20AllowanceResultFailure,
} from '../../src';
import { ethers, type Wallet, type providers } from 'ethers';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Aerodrome Swap Ability E2E Tests without Gas Sponsorship', () => {
  const EXPECTED_AERODROME_UNIVERSAL_ROUTER_ADDRESS = '0x01D40099fCD87C018969B0e8D4aB1633Fb34763C';

  const SWAP_AMOUNT = '10000'; // 0.01 USDC (6 decimals)
  const SWAP_TOKEN_IN_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC
  const SWAP_TOKEN_IN_DECIMALS = 6;

  const SWAP_TOKEN_OUT_ADDRESS = '0x4200000000000000000000000000000000000006'; // WETH

  const ENV = getEnv();

  let agentPkpInfo: PkpInfo;
  let wallets: {
    appDelegatee: Wallet;
    funder: Wallet;
    appManager: Wallet;
    agentWalletOwner: Wallet;
  };
  let baseRpcProvider: providers.JsonRpcProvider;

  beforeAll(async () => {
    await funder.checkFunderBalance();
    await delegatee.ensureAppDelegateeFunded();
    await appManager.ensureAppManagerFunded();

    const chainHelpers = await getChainHelpers();
    wallets = chainHelpers.wallets;
    baseRpcProvider = chainHelpers.providers.base;

    await ensureUnexpiredCapacityToken(wallets.appDelegatee);

    const PERMISSION_DATA: PermissionData = {
      // Aerodrome Swap Ability has no policies
      [aerodromeBundledAbility.ipfsCid]: {},
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
      // TODO Future optimization: Only create a new app version if the existing app version doesn't have the same ability and policy IPFS CIDs
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
  });

  afterAll(async () => {
    await disconnectVincentAbilityClients();
  });

  describe('Precheck Failure Scenarios', () => {
    it('should fail precheck because of invalid ability action', async () => {
      const aerodromeSwapAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: aerodromeBundledAbility,
        ethersSigner: wallets.appDelegatee,
      });

      const precheckResult = await aerodromeSwapAbilityClient.precheck(
        {
          // @ts-expect-error - invalid ability action
          action: 'invalid',
          alchemyGasSponsor: false,
          rpcUrl: ENV.BASE_RPC_URL,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          amountIn: SWAP_AMOUNT.toString(),
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );
      console.log(
        '[should fail precheck because of invalid ability action]',
        util.inspect(precheckResult, { depth: 10 }),
      );

      expect(precheckResult).toBeDefined();
      expect(precheckResult.success).toBe(false);

      if (precheckResult.success === false) {
        expect(precheckResult.runtimeError).toContain('Invalid precheck parameters.');
        expect(precheckResult.schemaValidationError).toBeTruthy();
        expect(precheckResult.schemaValidationError?.zodError.issues[0]).toMatchObject({
          received: 'invalid',
          code: 'invalid_enum_value',
          options: ['approve', 'swap'],
          path: ['action'],
          message: "Invalid enum value. Expected 'approve' | 'swap', received 'invalid'",
        });
      }
    });

    it('should fail precheck because of insufficient tokenIn allowance', async () => {
      const aerodromeSwapAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: aerodromeBundledAbility,
        ethersSigner: wallets.appDelegatee,
      });

      const precheckResult = await aerodromeSwapAbilityClient.precheck(
        {
          action: AbilityAction.Swap,
          alchemyGasSponsor: false,
          rpcUrl: ENV.BASE_RPC_URL,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          amountIn: SWAP_AMOUNT.toString(),
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );
      console.log(
        '[should fail precheck because of insufficient tokenIn allowance]',
        util.inspect(precheckResult, { depth: 10 }),
      );

      expect(precheckResult).toBeDefined();
      expect(precheckResult.success).toBe(false);

      expect(precheckResult.result).toBeDefined();
      const innerResult = precheckResult.result! as unknown as CheckErc20AllowanceResultFailure;
      expect(innerResult.reason).toBe(
        `[checkErc20Allowance] Address ${agentPkpInfo.ethAddress} has insufficient ERC20 allowance for spender ${EXPECTED_AERODROME_UNIVERSAL_ROUTER_ADDRESS} for token ${SWAP_TOKEN_IN_ADDRESS.toLowerCase()}`,
      );
      expect(innerResult.spenderAddress).toBe(EXPECTED_AERODROME_UNIVERSAL_ROUTER_ADDRESS);
      expect(innerResult.tokenAddress).toBe(SWAP_TOKEN_IN_ADDRESS.toLowerCase());
      expect(innerResult.requiredAllowance).toBe(SWAP_AMOUNT.toString());
      expect(innerResult.currentAllowance).toBe('0');
    });
  });

  describe('Execute ERC20 Approval Transaction', () => {
    it('should make a new ERC20 approval transaction for the Aerodrome Universal Router', async () => {
      const aerodromeSwapAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: aerodromeBundledAbility,
        ethersSigner: wallets.appDelegatee,
      });

      const executeResult = await aerodromeSwapAbilityClient.execute(
        {
          action: AbilityAction.Approve,
          rpcUrl: ENV.BASE_RPC_URL,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          amountIn: SWAP_AMOUNT.toString(),
          alchemyGasSponsor: false,
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );
      console.log(
        '[should make a new ERC20 approval transaction for the Aerodrome Universal Router]',
        util.inspect(executeResult, { depth: 10 }),
      );

      expect(executeResult).toBeDefined();
      expect(executeResult.success).toBe(true);
      if (executeResult.success === false) {
        throw new Error(executeResult.runtimeError);
      }

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.approvalTxHash).toBeDefined();

      const approvalTxHash = executeResult.result.approvalTxHash;
      expect(approvalTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      const approvalTxReceipt = await baseRpcProvider.waitForTransaction(
        approvalTxHash as string,
        1,
      );
      expect(approvalTxReceipt.status).toBe(1);
    });

    it('should not make a new ERC20 approval transaction for the Aerodrome Universal Router, and return the current allowance', async () => {
      const aerodromeSwapAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: aerodromeBundledAbility,
        ethersSigner: wallets.appDelegatee,
      });

      const executeResult = await aerodromeSwapAbilityClient.execute(
        {
          action: AbilityAction.Approve,
          rpcUrl: ENV.BASE_RPC_URL,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          amountIn: SWAP_AMOUNT.toString(),
          alchemyGasSponsor: false,
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );
      console.log(
        '[should not make a new ERC20 approval transaction for the Aerodrome Universal Router, and return the current allowance]',
        util.inspect(executeResult, { depth: 10 }),
      );

      expect(executeResult).toBeDefined();
      expect(executeResult.success).toBe(true);
      if (executeResult.success === false) {
        throw new Error(executeResult.runtimeError);
      }

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.approvalTxHash).toBeUndefined();
      expect(executeResult.result.currentAllowance!).toBe(SWAP_AMOUNT.toString());
      expect(executeResult.result.requiredAllowance!).toBe(SWAP_AMOUNT.toString());
    });
  });

  describe('Precheck & Execute Swap Success', () => {
    it('should successfully run precheck on the Aerodrome Swap Ability', async () => {
      const aerodromeSwapAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: aerodromeBundledAbility,
        ethersSigner: wallets.appDelegatee,
      });

      const precheckResult = await aerodromeSwapAbilityClient.precheck(
        {
          action: AbilityAction.Swap,
          rpcUrl: ENV.BASE_RPC_URL,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          amountIn: SWAP_AMOUNT.toString(),
          alchemyGasSponsor: false,
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(precheckResult).toBeDefined();
      console.log(
        '[should successfully run precheck on the Aerodrome Swap Ability]',
        util.inspect(precheckResult, { depth: 10 }),
      );

      if (precheckResult.success === false) {
        throw new Error(precheckResult.runtimeError);
      }

      // Verify the context is properly populated
      expect(precheckResult.context).toBeDefined();
      expect(precheckResult.context?.delegation.delegateeAddress).toBeDefined();
      expect(precheckResult.context?.delegation.delegatorPkpInfo.ethAddress).toBe(
        agentPkpInfo.ethAddress,
      );

      // Verify policies context
      expect(precheckResult.context?.policiesContext).toBeDefined();
      expect(precheckResult.context?.policiesContext.allow).toBe(true);
      expect(precheckResult.context?.policiesContext.evaluatedPolicies.length).toBe(0);

      // Verify the result is properly populated
      expect(precheckResult.result).toBeDefined();
      expect(precheckResult.result!.nativeTokenBalance).toBeDefined();
      expect(precheckResult.result!.tokenInAddress).toBe(SWAP_TOKEN_IN_ADDRESS.toLowerCase());
      expect(
        ethers.utils
          .parseUnits(precheckResult.result!.tokenInBalance as string, SWAP_TOKEN_IN_DECIMALS)
          .toBigInt(),
      ).toBeGreaterThan(0n);
      expect(precheckResult.result!.currentTokenInAllowanceForSpender as string).toBe(
        SWAP_AMOUNT.toString(),
      );
      expect(precheckResult.result!.spenderAddress).toBe(
        EXPECTED_AERODROME_UNIVERSAL_ROUTER_ADDRESS,
      );
      expect(precheckResult.result!.requiredTokenInAllowance!).toBe(SWAP_AMOUNT.toString());
    });

    it('should execute the Aerodrome Swap Ability with the Agent Wallet PKP', async () => {
      const aerodromeSwapAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: aerodromeBundledAbility,
        ethersSigner: wallets.appDelegatee,
      });

      const executeResult = await aerodromeSwapAbilityClient.execute(
        {
          action: AbilityAction.Swap,
          rpcUrl: ENV.BASE_RPC_URL,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          amountIn: SWAP_AMOUNT.toString(),
          alchemyGasSponsor: false,
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(executeResult).toBeDefined();
      console.log(
        '[should execute the Aerodrome Swap Ability with the Agent Wallet PKP]',
        util.inspect(executeResult, { depth: 10 }),
      );

      expect(executeResult.success).toBe(true);
      if (executeResult.success === false) {
        // A bit redundant, but typescript doesn't understand `expect().toBe(true)` is narrowing to the type.
        throw new Error(executeResult.runtimeError);
      }

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.swapTxHash).toBeDefined();

      const swapTxHash = executeResult.result.swapTxHash;
      expect(swapTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      const swapTxReceipt = await baseRpcProvider.waitForTransaction(swapTxHash as string, 1);
      expect(swapTxReceipt.status).toBe(1);
    });
  });
});
