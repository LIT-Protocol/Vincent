import { ethers } from 'ethers';
import {
  AbilityAction,
  bundledVincentAbility as aerodromeBundledAbility,
  CheckErc20AllowanceResultFailure,
} from '@lit-protocol/vincent-ability-aerodrome-swap';
import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import { getClient, PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as util from 'node:util';
import { LocalAccountSigner, SmartAccountClient } from '@aa-sdk/core';
import { LIT_NETWORK } from '@lit-protocol/constants';
import { alchemy, base as alchemyChainBase } from '@account-kit/infra';
import { createModularAccountV2Client } from '@account-kit/smart-contracts';

import {
  BASE_PUBLIC_CLIENT,
  BASE_RPC_URL,
  checkShouldMintAndFundPkp,
  DATIL_PUBLIC_CLIENT,
  getEnv,
  getTestConfig,
  TEST_APP_DELEGATEE_ACCOUNT,
  TEST_APP_DELEGATEE_PRIVATE_KEY,
  TEST_APP_MANAGER_PRIVATE_KEY,
  TEST_CONFIG_PATH,
  TestConfig,
  YELLOWSTONE_RPC_URL,
} from './helpers';
import { checkShouldMintCapacityCredit } from './helpers/check-mint-capcity-credit';
import {
  fundAppDelegateeIfNeeded,
  permitAbilitiesForAgentWalletPkp,
  permitAppVersionForAgentWalletPkp,
  registerNewApp,
  removeAppDelegateeIfNeeded,
} from './helpers/setup-fixtures';

const ALCHEMY_GAS_SPONSOR_API_KEY = getEnv('ALCHEMY_GAS_SPONSOR_API_KEY');
const ALCHEMY_GAS_SPONSOR_POLICY_ID = getEnv('ALCHEMY_GAS_SPONSOR_POLICY_ID');
const EXPECTED_AERODROME_UNIVERSAL_ROUTER_ADDRESS = '0x01D40099fCD87C018969B0e8D4aB1633Fb34763C';

// const SWAP_AMOUNT = 0.0003;
// const SWAP_TOKEN_IN_ADDRESS = '0x4200000000000000000000000000000000000006'; // WETH
// const SWAP_TOKEN_IN_DECIMALS = 18;

const SWAP_AMOUNT = 0.1;
const SWAP_TOKEN_IN_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC
const SWAP_TOKEN_IN_DECIMALS = 6;

const EXPECTED_SWAP_AMOUNT = ethers.utils.formatUnits(
  ethers.utils.parseUnits(SWAP_AMOUNT.toString(), SWAP_TOKEN_IN_DECIMALS),
  SWAP_TOKEN_IN_DECIMALS,
);

// const SWAP_TOKEN_OUT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC
// const SWAP_TOKEN_OUT_DECIMALS = 6;
const SWAP_TOKEN_OUT_ADDRESS = '0x4200000000000000000000000000000000000006'; // WETH
const SWAP_TOKEN_OUT_DECIMALS = 18;

const RPC_URL = BASE_RPC_URL;
const CHAIN_ID = 8453;

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

const contractClient = getClient({
  signer: new ethers.Wallet(
    TEST_APP_MANAGER_PRIVATE_KEY,
    new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
  ),
});

// Create a delegatee wallet for ability execution
const getDelegateeWallet = () => {
  return new ethers.Wallet(
    TEST_APP_DELEGATEE_PRIVATE_KEY as string,
    new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
  );
};

const getAerodromeSwapAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: aerodromeBundledAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

describe('Aerodrome Swap Ability E2E Tests', () => {
  // Define permission data for all abilities and policies
  const PERMISSION_DATA: PermissionData = {
    // Uniswap Swap Ability has no policies
    [aerodromeBundledAbility.ipfsCid]: {},
  };

  // An array of the IPFS cid of each ability to be tested, computed from the keys of PERMISSION_DATA
  const TOOL_IPFS_IDS: string[] = Object.keys(PERMISSION_DATA);

  // Define the policies for each ability, computed from TOOL_IPFS_IDS and PERMISSION_DATA
  const TOOL_POLICIES = TOOL_IPFS_IDS.map((abilityIpfsCid) => {
    // Get the policy IPFS CIDs for this ability from PERMISSION_DATA
    return Object.keys(PERMISSION_DATA[abilityIpfsCid]);
  });

  let TEST_CONFIG: TestConfig;
  let LIT_NODE_CLIENT: LitNodeClient;

  beforeAll(async () => {
    TEST_CONFIG = getTestConfig(TEST_CONFIG_PATH);
    TEST_CONFIG = await checkShouldMintAndFundPkp(TEST_CONFIG);
    TEST_CONFIG = await checkShouldMintCapacityCredit(TEST_CONFIG);

    // The Agent Wallet PKP needs to have Base ETH
    // in order to execute the Aerodrome Swap Ability
    const agentWalletPkpBaseEthBalance = await BASE_PUBLIC_CLIENT.getBalance({
      address: TEST_CONFIG.userPkp!.ethAddress! as `0x${string}`,
    });
    if (agentWalletPkpBaseEthBalance === 0n) {
      throw new Error(
        `❌ Agent Wallet PKP has no Base ETH. Please fund ${TEST_CONFIG.userPkp!.ethAddress!} with Base ETH`,
      );
    } else {
      console.log(`ℹ️  Agent Wallet PKP has ${formatEther(agentWalletPkpBaseEthBalance)} Base ETH`);
    }

    // The App Manager needs to have Lit test tokens
    // in order to interact with the Vincent contract
    const appManagerLitTestTokenBalance = await DATIL_PUBLIC_CLIENT.getBalance({
      address: privateKeyToAccount(TEST_APP_MANAGER_PRIVATE_KEY as `0x${string}`).address,
    });
    if (appManagerLitTestTokenBalance === 0n) {
      throw new Error(
        `❌ App Manager has no Lit test tokens. Please fund ${
          privateKeyToAccount(TEST_APP_MANAGER_PRIVATE_KEY as `0x${string}`).address
        } with Lit test tokens`,
      );
    } else {
      console.log(
        `ℹ️  App Manager has ${formatEther(appManagerLitTestTokenBalance)} Lit test tokens`,
      );
    }

    await fundAppDelegateeIfNeeded();

    LIT_NODE_CLIENT = new LitNodeClient({
      litNetwork: LIT_NETWORK.Datil,
      debug: true,
    });
    await LIT_NODE_CLIENT.connect();
  });

  afterAll(async () => {
    console.log('Disconnecting from Lit node client...');
    await disconnectVincentAbilityClients();
    await LIT_NODE_CLIENT.disconnect();
  });

  describe('Setup', () => {
    it('should permit the Aerodrome Swap Ability for the Agent Wallet PKP', async () => {
      await permitAbilitiesForAgentWalletPkp([aerodromeBundledAbility.ipfsCid], TEST_CONFIG);
    });

    it('should remove TEST_APP_DELEGATEE_ACCOUNT from an existing App if needed', async () => {
      await removeAppDelegateeIfNeeded();
    });

    it('should register a new App', async () => {
      TEST_CONFIG = await registerNewApp(
        TOOL_IPFS_IDS,
        TOOL_POLICIES,
        TEST_CONFIG,
        TEST_CONFIG_PATH,
      );
    });

    it('should permit the App version for the Agent Wallet PKP', async () => {
      await permitAppVersionForAgentWalletPkp(PERMISSION_DATA, TEST_CONFIG);
    });

    it('should validate the Delegatee has permission to execute the Aerodrome Swap Ability with the Agent Wallet PKP', async () => {
      const validationResult = await contractClient.validateAbilityExecutionAndGetPolicies({
        delegateeAddress: TEST_APP_DELEGATEE_ACCOUNT.address,
        pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        abilityIpfsCid: TOOL_IPFS_IDS[0],
      });

      expect(validationResult).toBeDefined();
      expect(validationResult.isPermitted).toBe(true);
      expect(validationResult.appId).toBe(TEST_CONFIG.appId!);
      expect(validationResult.appVersion).toBe(TEST_CONFIG.appVersion!);

      console.log(
        '[contractClient.validateAbilityExecutionAndGetPolicies.decodedPolicies]',
        validationResult.decodedPolicies,
      );
      expect(Object.keys(validationResult.decodedPolicies)).toHaveLength(0);
    });
  });

  describe('Precheck and Execute without Alchemy Gas Sponsorship', () => {
    it('should fail precheck because of invalid ability action', async () => {
      const aerodromeSwapAbilityClient = getAerodromeSwapAbilityClient();

      // Try to precheck with the malicious quote
      const precheckResult = await aerodromeSwapAbilityClient.precheck(
        {
          // @ts-expect-error - invalid ability action
          action: 'invalid',
          alchemyGasSponsor: false,
          rpcUrl: RPC_URL,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          amountIn: SWAP_AMOUNT.toString(),
        },
        {
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        },
      );
      console.log(
        '[should fail precheck because of invalid ability action]',
        util.inspect(precheckResult, { depth: 10 }),
      );

      // Precheck should fail with recipient validation error
      expect(precheckResult).toBeDefined();
      expect(precheckResult.success).toBe(false);

      if (precheckResult.success === false) {
        expect(precheckResult.runtimeError).toContain('Invalid precheck parameters.');
        expect(precheckResult.schemaValidationError).toBeTruthy();
      }
    });

    it('should fail precheck because of insufficient tokenIn allowance', async () => {
      const aerodromeSwapAbilityClient = getAerodromeSwapAbilityClient();

      const precheckResult = await aerodromeSwapAbilityClient.precheck(
        {
          action: AbilityAction.Swap,
          alchemyGasSponsor: false,
          rpcUrl: RPC_URL,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          amountIn: SWAP_AMOUNT.toString(),
        },
        {
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        },
      );
      console.log(
        '[should fail precheck because of insufficient tokenIn allowance]',
        util.inspect(precheckResult, { depth: 10 }),
      );

      // Precheck should fail with recipient validation error
      expect(precheckResult).toBeDefined();
      expect(precheckResult.success).toBe(false);

      expect(precheckResult.result).toBeDefined();
      const innerResult = precheckResult.result! as unknown as CheckErc20AllowanceResultFailure;
      expect(innerResult.reason).toBe(
        `[checkErc20Allowance] Address ${TEST_CONFIG.userPkp!.ethAddress!} has insufficient ERC20 allowance for spender ${EXPECTED_AERODROME_UNIVERSAL_ROUTER_ADDRESS} for token ${SWAP_TOKEN_IN_ADDRESS.toLowerCase()}`,
      );
      expect(innerResult.spenderAddress).toBe(EXPECTED_AERODROME_UNIVERSAL_ROUTER_ADDRESS);
      expect(innerResult.tokenAddress).toBe(SWAP_TOKEN_IN_ADDRESS.toLowerCase());
      expect(innerResult.requiredAllowance).toBe(EXPECTED_SWAP_AMOUNT);
      expect(innerResult.currentAllowance).toBe('0.0');
    });

    it('should make a new ERC20 approval transaction for the Aerodrome Universal Router', async () => {
      const aerodromeSwapAbilityClient = getAerodromeSwapAbilityClient();

      const executeResult = await aerodromeSwapAbilityClient.execute(
        {
          action: AbilityAction.Approve,
          rpcUrl: RPC_URL,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          amountIn: SWAP_AMOUNT.toString(),
          alchemyGasSponsor: false,
        },
        {
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
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

      const approvalTxReceipt = await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: approvalTxHash as `0x${string}`,
      });
      expect(approvalTxReceipt.status).toBe('success');
    });

    it('should not make a new ERC20 approval transaction for the Aerodrome Universal Router, and return the current allowance', async () => {
      const aerodromeSwapAbilityClient = getAerodromeSwapAbilityClient();

      const executeResult = await aerodromeSwapAbilityClient.execute(
        {
          action: AbilityAction.Approve,
          rpcUrl: RPC_URL,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          amountIn: SWAP_AMOUNT.toString(),
          alchemyGasSponsor: false,
        },
        {
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
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
      expect(executeResult.result.currentAllowance!).toBe(EXPECTED_SWAP_AMOUNT);
      expect(executeResult.result.requiredAllowance!).toBe(EXPECTED_SWAP_AMOUNT);
    });

    it('should successfully run precheck on the Aerodrome Swap Ability', async () => {
      const aerodromeSwapAbilityClient = getAerodromeSwapAbilityClient();

      const precheckResult = await aerodromeSwapAbilityClient.precheck(
        {
          action: 'swap',
          rpcUrl: RPC_URL,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          amountIn: SWAP_AMOUNT.toString(),
          slippage: 0.005,
          alchemyGasSponsor: false,
        },
        {
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
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
    });

    it('should execute the Aerodrome Swap Ability with the Agent Wallet PKP', async () => {
      const aerodromeSwapAbilityClient = getAerodromeSwapAbilityClient();

      const executeResult = await aerodromeSwapAbilityClient.execute(
        {
          action: 'swap',
          rpcUrl: RPC_URL,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          amountIn: SWAP_AMOUNT.toString(),
          slippage: 0.005,
          alchemyGasSponsor: false,
        },
        {
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
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

      console.log(executeResult);

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.swapTxHash).toBeDefined();

      const swapTxHash = executeResult.result.swapTxHash;
      expect(swapTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      const swapTxReceipt = await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: swapTxHash as `0x${string}`,
      });
      expect(swapTxReceipt.status).toBe('success');
    });
  });

  describe('Precheck and Execute with Alchemy Gas Sponsorship', () => {
    let SMART_ACCOUNT_CLIENT: SmartAccountClient;

    beforeAll(async () => {
      SMART_ACCOUNT_CLIENT = await createModularAccountV2Client({
        mode: '7702' as const,
        transport: alchemy({ apiKey: ALCHEMY_GAS_SPONSOR_API_KEY }),
        chain: alchemyChainBase,
        // random signing wallet because this is just for converting the userOp hash to a tx hash
        signer: LocalAccountSigner.privateKeyToAccountSigner(
          ethers.Wallet.createRandom().privateKey as `0x${string}`,
        ),
        policyId: ALCHEMY_GAS_SPONSOR_POLICY_ID,
      });
    });

    it('should fail precheck because of insufficient tokenIn allowance', async () => {
      const aerodromeSwapAbilityClient = getAerodromeSwapAbilityClient();

      // Try to precheck with the malicious quote
      const precheckResult = await aerodromeSwapAbilityClient.precheck(
        {
          action: AbilityAction.Swap,
          rpcUrl: RPC_URL,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          amountIn: SWAP_AMOUNT.toString(),
          alchemyGasSponsor: true,
          alchemyGasSponsorApiKey: ALCHEMY_GAS_SPONSOR_API_KEY,
          alchemyGasSponsorPolicyId: ALCHEMY_GAS_SPONSOR_POLICY_ID,
        },
        {
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        },
      );
      console.log(
        '[should fail precheck because of insufficient tokenIn allowance]',
        util.inspect(precheckResult, { depth: 10 }),
      );

      // Precheck should fail with recipient validation error
      expect(precheckResult).toBeDefined();
      expect(precheckResult.success).toBe(false);

      expect(precheckResult.result).toBeDefined();
      const innerResult = precheckResult.result! as unknown as CheckErc20AllowanceResultFailure;
      expect(innerResult.reason).toBe(
        `[checkErc20Allowance] Address ${TEST_CONFIG.userPkp!.ethAddress!} has insufficient ERC20 allowance for spender ${EXPECTED_AERODROME_UNIVERSAL_ROUTER_ADDRESS} for token ${SWAP_TOKEN_IN_ADDRESS.toLowerCase()}`,
      );
      expect(innerResult.spenderAddress).toBe(EXPECTED_AERODROME_UNIVERSAL_ROUTER_ADDRESS);
      expect(innerResult.tokenAddress).toBe(SWAP_TOKEN_IN_ADDRESS.toLowerCase());
      expect(innerResult.requiredAllowance).toBe(EXPECTED_SWAP_AMOUNT);
      expect(innerResult.currentAllowance).toBe('0.0');
    });

    it('should make a new ERC20 approval transaction for the Aerodrome Universal Router', async () => {
      const aerodromeSwapAbilityClient = getAerodromeSwapAbilityClient();

      const executeResult = await aerodromeSwapAbilityClient.execute(
        {
          action: AbilityAction.Approve,
          rpcUrl: RPC_URL,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          amountIn: SWAP_AMOUNT.toString(),
          alchemyGasSponsor: true,
          alchemyGasSponsorApiKey: ALCHEMY_GAS_SPONSOR_API_KEY,
          alchemyGasSponsorPolicyId: ALCHEMY_GAS_SPONSOR_POLICY_ID,
        },
        {
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
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
      expect(executeResult.result.approvalTxHash).toBeUndefined();
      expect(executeResult.result.approvalTxUserOperationHash).toBeDefined();

      const approvalTxUserOperationHash = executeResult.result.approvalTxUserOperationHash;
      const approvalTxHash = await SMART_ACCOUNT_CLIENT.waitForUserOperationTransaction({
        hash: approvalTxUserOperationHash,
      });
      expect(approvalTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      console.log(
        '[should make a new ERC20 approval transaction for the Uniswap router] sponsored approval tx hash',
        approvalTxHash,
      );

      const approvalTxReceipt = await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: approvalTxHash as `0x${string}`,
      });
      expect(approvalTxReceipt.status).toBe('success');
    });

    it('should not make a new ERC20 approval transaction for the Aerodrome Universal Router, and return the current allowance', async () => {
      const aerodromeSwapAbilityClient = getAerodromeSwapAbilityClient();

      const executeResult = await aerodromeSwapAbilityClient.execute(
        {
          action: AbilityAction.Approve,
          rpcUrl: RPC_URL,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          amountIn: SWAP_AMOUNT.toString(),
          alchemyGasSponsor: true,
          alchemyGasSponsorApiKey: ALCHEMY_GAS_SPONSOR_API_KEY,
          alchemyGasSponsorPolicyId: ALCHEMY_GAS_SPONSOR_POLICY_ID,
        },
        {
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        },
      );
      console.log(
        '[should not make a new ERC20 approval transaction for the Uniswap router, and return the current allowance]',
        util.inspect(executeResult, { depth: 10 }),
      );

      expect(executeResult).toBeDefined();
      expect(executeResult.success).toBe(true);
      if (executeResult.success === false) {
        throw new Error(executeResult.runtimeError);
      }

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.approvalTxHash).toBeUndefined();
      expect(executeResult.result.currentAllowance!).toBe(EXPECTED_SWAP_AMOUNT);
      expect(executeResult.result.requiredAllowance!).toBe(EXPECTED_SWAP_AMOUNT);
    });

    it('should successfully run precheck on the Aerodrome Swap Ability', async () => {
      const aerodromeSwapAbilityClient = getAerodromeSwapAbilityClient();

      const precheckResult = await aerodromeSwapAbilityClient.precheck(
        {
          action: AbilityAction.Swap,
          rpcUrl: RPC_URL,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          amountIn: SWAP_AMOUNT.toString(),
          alchemyGasSponsor: true,
          alchemyGasSponsorApiKey: ALCHEMY_GAS_SPONSOR_API_KEY,
          alchemyGasSponsorPolicyId: ALCHEMY_GAS_SPONSOR_POLICY_ID,
        },
        {
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
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
        TEST_CONFIG.userPkp!.ethAddress!,
      );

      // Verify policies context
      expect(precheckResult.context?.policiesContext).toBeDefined();
      expect(precheckResult.context?.policiesContext.allow).toBe(true);
      expect(precheckResult.context?.policiesContext.evaluatedPolicies.length).toBe(0);

      // Verify the result is properly populated
      expect(precheckResult.result).toBeDefined();
      expect(precheckResult.result!.nativeTokenBalance).toBeUndefined();
      expect(precheckResult.result!.tokenInAddress).toBe(SWAP_TOKEN_IN_ADDRESS.toLowerCase());
      expect(
        ethers.utils
          .parseUnits(precheckResult.result!.tokenInBalance as string, SWAP_TOKEN_IN_DECIMALS)
          .toBigInt(),
      ).toBeGreaterThan(0n);
      expect(precheckResult.result!.currentTokenInAllowanceForSpender as string).toBe(
        EXPECTED_SWAP_AMOUNT,
      );
      expect(precheckResult.result!.spenderAddress).toBe(
        EXPECTED_AERODROME_UNIVERSAL_ROUTER_ADDRESS,
      );
      expect(precheckResult.result!.requiredTokenInAllowance!).toBe(EXPECTED_SWAP_AMOUNT);
    });

    it('should execute the Aerodrome Swap Ability with the Agent Wallet PKP', async () => {
      const aerodromeSwapAbilityClient = getAerodromeSwapAbilityClient();

      const executeResult = await aerodromeSwapAbilityClient.execute(
        {
          action: AbilityAction.Swap,
          rpcUrl: RPC_URL,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          amountIn: SWAP_AMOUNT.toString(),
          alchemyGasSponsor: true,
          alchemyGasSponsorApiKey: ALCHEMY_GAS_SPONSOR_API_KEY,
          alchemyGasSponsorPolicyId: ALCHEMY_GAS_SPONSOR_POLICY_ID,
        },
        {
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        },
      );

      expect(executeResult).toBeDefined();

      expect(executeResult.success).toBe(true);
      if (executeResult.success === false) {
        // A bit redundant, but typescript doesn't understand `expect().toBe(true)` is narrowing to the type.
        throw new Error(executeResult.runtimeError);
      }

      console.log(executeResult);

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.swapTxHash).toBeUndefined();
      expect(executeResult.result.swapTxUserOperationHash).toBeDefined();

      const swapTxUserOperationHash = executeResult.result.swapTxUserOperationHash;
      const swapTxHash = await SMART_ACCOUNT_CLIENT.waitForUserOperationTransaction({
        hash: swapTxUserOperationHash,
      });
      expect(swapTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      console.log(
        '[should execute the Aerodrome Swap Ability with the Agent Wallet PKP] sponsored swap tx hash',
        swapTxHash,
      );

      const swapTxReceipt = await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: swapTxHash as `0x${string}`,
      });
      expect(swapTxReceipt.status).toBe('success');
    });
  });
});
