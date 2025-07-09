import { encodeAbiParameters, formatEther, parseEventLogs } from 'viem';

import { getVincentToolClient, disconnectVincentToolClients } from '@lit-protocol/vincent-app-sdk';
import { ethers } from 'ethers';

// Import all bundled Vincent tools from the generated directory
// Policy failure tools - evaluate
import { bundledVincentTool as evaluateDenyThrowErrorTool } from '../src/generated/tools/withPolicyFailures/evaluateDenyThrowError/vincent-bundled-tool';
import { bundledVincentTool as evaluateDenyWithSchemaTool } from '../src/generated/tools/withPolicyFailures/evaluateDenyWithSchema/vincent-bundled-tool';
import { bundledVincentTool as evaluateDenyNoSchemaErrorResultTool } from '../src/generated/tools/withPolicyFailures/evaluateDenyNoSchemaErrorResult/vincent-bundled-tool';
import { bundledVincentTool as evaluateDenyNoSchemaNoResultTool } from '../src/generated/tools/withPolicyFailures/evaluateDenyNoSchemaNoResult/vincent-bundled-tool';

// Policy failure tools - precheck
import { bundledVincentTool as precheckDenyThrowErrorTool } from '../src/generated/tools/withPolicyFailures/precheckDenyThrowError/vincent-bundled-tool';
import { bundledVincentTool as precheckDenyWithSchemaTool } from '../src/generated/tools/withPolicyFailures/precheckDenyWithSchema/vincent-bundled-tool';
import { bundledVincentTool as precheckDenyNoSchemaErrorResultTool } from '../src/generated/tools/withPolicyFailures/precheckDenyNoSchemaErrorResult/vincent-bundled-tool';
import { bundledVincentTool as precheckDenyNoSchemaNoResultTool } from '../src/generated/tools/withPolicyFailures/precheckDenyNoSchemaNoResult/vincent-bundled-tool';

// Import policy metadata
// Evaluate policy metadata
import evaluateDenyThrowErrorMetadata from '../src/generated/policies/deny/noSchema/evaluateDenyThrowError/vincent-policy-metadata.json';
import evaluateDenyWithSchemaMetadata from '../src/generated/policies/deny/withSchema/evaluateDenyWithSchema/vincent-policy-metadata.json';
import evaluateDenyNoSchemaErrorResultMetadata from '../src/generated/policies/deny/noSchema/evaluateDenyNoSchemaErrorResult/vincent-policy-metadata.json';
import evaluateDenyNoSchemaNoResultMetadata from '../src/generated/policies/deny/noSchema/evaluateDenyNoSchemaNoResult/vincent-policy-metadata.json';

// Precheck policy metadata
import precheckDenyThrowErrorMetadata from '../src/generated/policies/deny/noSchema/precheckDenyThrowError/vincent-policy-metadata.json';
import precheckDenyWithSchemaMetadata from '../src/generated/policies/deny/withSchema/precheckDenyWithSchema/vincent-policy-metadata.json';
import precheckDenyNoSchemaErrorResultMetadata from '../src/generated/policies/deny/noSchema/precheckDenyNoSchemaErrorResult/vincent-policy-metadata.json';
import precheckDenyNoSchemaNoResultMetadata from '../src/generated/policies/deny/noSchema/precheckDenyNoSchemaNoResult/vincent-policy-metadata.json';

// Commit policy metadata
import commitDenyThrowErrorMetadata from '../src/generated/policies/deny/noSchema/commitDenyThrowError/vincent-policy-metadata.json';
import commitDenyWithSchemaMetadata from '../src/generated/policies/deny/withSchema/commitDenyWithSchema/vincent-policy-metadata.json';
import commitDenyNoSchemaErrorResultMetadata from '../src/generated/policies/deny/noSchema/commitDenyNoSchemaErrorResult/vincent-policy-metadata.json';
import commitDenyNoSchemaNoResultMetadata from '../src/generated/policies/deny/noSchema/commitDenyNoSchemaNoResult/vincent-policy-metadata.json';

import {
  TestConfig,
  getTestConfig,
  TEST_CONFIG_PATH,
  checkShouldMintAndFundPkp,
  BASE_PUBLIC_CLIENT,
  TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,
  permitAuthMethods,
  TEST_APP_MANAGER_VIEM_WALLET_CLIENT,
  DATIL_PUBLIC_CLIENT,
  VINCENT_ADDRESS,
  TEST_APP_DELEGATEE_ACCOUNT,
  TEST_APP_MANAGER_VIEM_ACCOUNT,
  DELEGATEES,
  saveTestConfig,
  TEST_AGENT_WALLET_PKP_OWNER_VIEM_WALLET_CLIENT,
  APP_NAME,
  APP_DESCRIPTION,
  AUTHORIZED_REDIRECT_URIS,
  DEPLOYMENT_STATUS,
  PARAMETER_TYPE,
  TEST_APP_DELEGATEE_PRIVATE_KEY,
  YELLOWSTONE_RPC_URL,
} from './helpers';
import {
  VincentAppFacetAbi,
  VincentAppViewFacetAbi,
  VincentUserFacetAbi,
} from './vincent-contract-abis';
import { checkShouldMintCapacityCredit } from './helpers/check-mint-capcity-credit';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

// Create a delegatee wallet for tool execution; used as `ethersSigner` for `getVincentToolClient()` for each tool to be tested.
const getDelegateeWallet = () => {
  return new ethers.Wallet(
    TEST_APP_DELEGATEE_PRIVATE_KEY as string,
    new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
  );
};

// Helper functions to get a VincentToolClient for each tool
// Evaluate policy failure tools
const getEvaluateDenyThrowErrorToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: evaluateDenyThrowErrorTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getEvaluateDenyWithSchemaToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: evaluateDenyWithSchemaTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getEvaluateDenyNoSchemaErrorResultToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: evaluateDenyNoSchemaErrorResultTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getEvaluateDenyNoSchemaNoResultToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: evaluateDenyNoSchemaNoResultTool,
    ethersSigner: getDelegateeWallet(),
  });
};

// Precheck policy failure tools
const getPrecheckDenyThrowErrorToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: precheckDenyThrowErrorTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckDenyWithSchemaToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: precheckDenyWithSchemaTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckDenyNoSchemaErrorResultToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: precheckDenyNoSchemaErrorResultTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckDenyNoSchemaNoResultToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: precheckDenyNoSchemaNoResultTool,
    ethersSigner: getDelegateeWallet(),
  });
};

describe('VincentToolClient policy failure tests', () => {
  // An array of the IPFS cid of each tool to be tested. Can be read from each BundledVincentTool
  const TOOL_IPFS_IDS: string[] = [
    // Evaluate policy failure tools
    evaluateDenyThrowErrorTool.ipfsCid,
    evaluateDenyWithSchemaTool.ipfsCid,
    evaluateDenyNoSchemaErrorResultTool.ipfsCid,
    evaluateDenyNoSchemaNoResultTool.ipfsCid,

    // Precheck policy failure tools
    precheckDenyThrowErrorTool.ipfsCid,
    precheckDenyWithSchemaTool.ipfsCid,
    precheckDenyNoSchemaErrorResultTool.ipfsCid,
    precheckDenyNoSchemaNoResultTool.ipfsCid,
  ];

  // Define the policies for each tool
  const TOOL_POLICIES = [
    // Evaluate policy failure tools
    [evaluateDenyThrowErrorMetadata.ipfsCid],
    [evaluateDenyWithSchemaMetadata.ipfsCid],
    [evaluateDenyNoSchemaErrorResultMetadata.ipfsCid],
    [evaluateDenyNoSchemaNoResultMetadata.ipfsCid],

    // Precheck policy failure tools
    [precheckDenyThrowErrorMetadata.ipfsCid],
    [precheckDenyWithSchemaMetadata.ipfsCid],
    [precheckDenyNoSchemaErrorResultMetadata.ipfsCid],
    [precheckDenyNoSchemaNoResultMetadata.ipfsCid],

    // Commit policy failure tools
    [commitDenyThrowErrorMetadata.ipfsCid],
    [commitDenyWithSchemaMetadata.ipfsCid],
    [commitDenyNoSchemaErrorResultMetadata.ipfsCid],
    [commitDenyNoSchemaNoResultMetadata.ipfsCid],
  ];

  // Define parameter names for each policy
  const TOOL_POLICY_PARAMETER_NAMES = [
    // Evaluate policy failure tools
    [['y']],
    [['y']],
    [['y']],
    [['y']],

    // Precheck policy failure tools
    [['y']],
    [['y']],
    [['y']],
    [['y']],

    // Commit policy failure tools
    [['y']],
    [['y']],
    [['y']],
    [['y']],
  ];

  // Define parameter types for each policy
  const TOOL_POLICY_PARAMETER_TYPES = [
    // Evaluate policy failure tools
    [[PARAMETER_TYPE.STRING]],
    [[PARAMETER_TYPE.STRING]],
    [[PARAMETER_TYPE.STRING]],
    [[PARAMETER_TYPE.STRING]],

    // Precheck policy failure tools
    [[PARAMETER_TYPE.STRING]],
    [[PARAMETER_TYPE.STRING]],
    [[PARAMETER_TYPE.STRING]],
    [[PARAMETER_TYPE.STRING]],

    // Commit policy failure tools
    [[PARAMETER_TYPE.STRING]],
    [[PARAMETER_TYPE.STRING]],
    [[PARAMETER_TYPE.STRING]],
    [[PARAMETER_TYPE.STRING]],
  ];

  // Define parameter values for each policy
  const TOOL_POLICY_PARAMETER_VALUES = [
    // Evaluate policy failure tools
    [[encodeAbiParameters([{ type: 'string' }], ['test-value'])]],
    [[encodeAbiParameters([{ type: 'string' }], ['test-value'])]],
    [[encodeAbiParameters([{ type: 'string' }], ['test-value'])]],
    [[encodeAbiParameters([{ type: 'string' }], ['test-value'])]],

    // Precheck policy failure tools
    [[encodeAbiParameters([{ type: 'string' }], ['test-value'])]],
    [[encodeAbiParameters([{ type: 'string' }], ['test-value'])]],
    [[encodeAbiParameters([{ type: 'string' }], ['test-value'])]],
    [[encodeAbiParameters([{ type: 'string' }], ['test-value'])]],

    // Commit policy failure tools
    [[encodeAbiParameters([{ type: 'string' }], ['test-value'])]],
    [[encodeAbiParameters([{ type: 'string' }], ['test-value'])]],
    [[encodeAbiParameters([{ type: 'string' }], ['test-value'])]],
    [[encodeAbiParameters([{ type: 'string' }], ['test-value'])]],
  ];

  let TEST_CONFIG: TestConfig;

  afterAll(async () => {
    console.log('Disconnecting from Lit node client...');
    await disconnectVincentToolClients();
  });

  beforeAll(async () => {
    TEST_CONFIG = getTestConfig(TEST_CONFIG_PATH);
    TEST_CONFIG = await checkShouldMintAndFundPkp(TEST_CONFIG);
    TEST_CONFIG = await checkShouldMintCapacityCredit(TEST_CONFIG);

    // The Agent Wallet PKP needs to have Base ETH and WETH
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

    const agentWalletPkpBaseWethBalance = await BASE_PUBLIC_CLIENT.getBalance({
      address: TEST_CONFIG.userPkp!.ethAddress! as `0x${string}`,
    });
    if (agentWalletPkpBaseWethBalance === 0n) {
      throw new Error(
        `❌ Agent Wallet PKP has no Base WETH. Please fund ${TEST_CONFIG.userPkp!.ethAddress!} with Base WETH`,
      );
    } else {
      console.log(
        `ℹ️  Agent Wallet PKP has ${formatEther(agentWalletPkpBaseWethBalance)} Base WETH`,
      );
    }

    // The App Manager needs to have Lit test tokens
    const appManagerLitTestTokenBalance = await DATIL_PUBLIC_CLIENT.getBalance({
      address: TEST_APP_MANAGER_VIEM_ACCOUNT.address,
    });
    if (appManagerLitTestTokenBalance === 0n) {
      throw new Error(
        `❌ App Manager has no Lit test tokens. Please fund ${TEST_APP_MANAGER_VIEM_ACCOUNT.address} with Lit test tokens`,
      );
    } else {
      console.log(
        `ℹ️  App Manager has ${formatEther(appManagerLitTestTokenBalance)} Lit test tokens`,
      );
    }
  });

  it('should permit all of the tools for the Agent Wallet PKP', async () => {
    await permitAuthMethods.call(
      permitAuthMethods,
      ...[
        TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`,
        TEST_CONFIG.userPkp!.tokenId!,
        TOOL_IPFS_IDS,
      ],
    );
  });

  it('should remove TEST_APP_DELEGATEE_ACCOUNT from an existing App if needed', async () => {
    if (TEST_CONFIG.appId !== null) {
      const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.writeContract({
        address: VINCENT_ADDRESS as `0x${string}`,
        abi: VincentAppFacetAbi,
        functionName: 'removeDelegatee',
        args: [TEST_CONFIG.appId, TEST_APP_DELEGATEE_ACCOUNT.address],
      });

      const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: txHash,
      });

      expect(txReceipt.status).toBe('success');
      console.log(`Removed Delegatee from App ID: ${TEST_CONFIG.appId}\nTx hash: ${txHash}`);
    } else {
      console.log('🔄 No existing App ID found, checking if Delegatee is registered to an App...');

      let registeredApp: {
        id: bigint;
        name: string;
        description: string;
        isDeleted: boolean;
        deploymentStatus: number;
        manager: `0x${string}`;
        latestVersion: bigint;
        delegatees: `0x${string}`[];
        authorizedRedirectUris: string[];
      } | null = null;

      try {
        registeredApp = (await DATIL_PUBLIC_CLIENT.readContract({
          address: VINCENT_ADDRESS as `0x${string}`,
          abi: VincentAppViewFacetAbi,
          functionName: 'getAppByDelegatee',
          args: [TEST_APP_DELEGATEE_ACCOUNT.address],
        })) as typeof registeredApp;

        if (registeredApp!.manager !== TEST_APP_MANAGER_VIEM_ACCOUNT.address) {
          throw new Error(
            `❌ App Delegatee: ${TEST_APP_DELEGATEE_ACCOUNT.address} is already registered to App ID: ${registeredApp!.id.toString()}, and TEST_APP_MANAGER_PRIVATE_KEY is not the owner of the App`,
          );
        }

        console.log(
          `ℹ️  App Delegatee: ${TEST_APP_DELEGATEE_ACCOUNT.address} is already registered to App ID: ${registeredApp!.id.toString()}. Removing Delegatee...`,
        );

        const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.writeContract({
          address: VINCENT_ADDRESS as `0x${string}`,
          abi: VincentAppFacetAbi,
          functionName: 'removeDelegatee',
          args: [registeredApp!.id, TEST_APP_DELEGATEE_ACCOUNT.address],
        });

        const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
          hash: txHash,
        });

        expect(txReceipt.status).toBe('success');
        console.log(`ℹ️  Removed Delegatee from App ID: ${registeredApp!.id}\nTx hash: ${txHash}`);
      } catch (error: unknown) {
        // Check if the error is a DelegateeNotRegistered revert
        if (error instanceof Error && error.message.includes('DelegateeNotRegistered')) {
          console.log(
            `ℹ️  App Delegatee: ${TEST_APP_DELEGATEE_ACCOUNT.address} is not registered to any App.`,
          );
        } else {
          throw new Error(
            `❌ Error checking if delegatee is registered: ${(error as Error).message}`,
          );
        }
      }
    }
  });

  it('should register a new App', async () => {
    const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.writeContract({
      address: VINCENT_ADDRESS as `0x${string}`,
      abi: VincentAppFacetAbi,
      functionName: 'registerApp',
      args: [
        // AppInfo
        {
          name: APP_NAME,
          description: APP_DESCRIPTION,
          deploymentStatus: DEPLOYMENT_STATUS.DEV,
          authorizedRedirectUris: AUTHORIZED_REDIRECT_URIS,
          delegatees: DELEGATEES,
        },
        // VersionTools
        {
          toolIpfsCids: TOOL_IPFS_IDS,

          toolPolicies: TOOL_POLICIES,
          toolPolicyParameterNames: TOOL_POLICY_PARAMETER_NAMES,
          toolPolicyParameterTypes: TOOL_POLICY_PARAMETER_TYPES,
        },
      ],
    });

    const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: txHash,
    });
    expect(txReceipt.status).toBe('success');

    const parsedLogs = parseEventLogs({
      abi: VincentAppFacetAbi,
      logs: txReceipt.logs,
    });
    // @ts-expect-error eventName exists?
    const appRegisteredLog = parsedLogs.filter((log) => log.eventName === 'NewAppRegistered');
    // @ts-expect-error args exists?
    const newAppId = appRegisteredLog[0].args.appId;

    expect(newAppId).toBeDefined();
    if (TEST_CONFIG.appId !== null) expect(newAppId).toBeGreaterThan(BigInt(TEST_CONFIG.appId));

    TEST_CONFIG.appId = newAppId;
    TEST_CONFIG.appVersion = '1';
    saveTestConfig(TEST_CONFIG_PATH, TEST_CONFIG);
    console.log(`Registered new App with ID: ${TEST_CONFIG.appId}\nTx hash: ${txHash}`);
  });

  it('should permit the App version for the Agent Wallet PKP', async () => {
    const txHash = await TEST_AGENT_WALLET_PKP_OWNER_VIEM_WALLET_CLIENT.writeContract({
      address: VINCENT_ADDRESS as `0x${string}`,
      abi: VincentUserFacetAbi,
      functionName: 'permitAppVersion',
      args: [
        BigInt(TEST_CONFIG.userPkp!.tokenId!),
        BigInt(TEST_CONFIG.appId!),
        BigInt(TEST_CONFIG.appVersion!),
        TOOL_IPFS_IDS,

        TOOL_POLICIES,
        TOOL_POLICY_PARAMETER_NAMES,
        TOOL_POLICY_PARAMETER_VALUES,
      ],
    });

    const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: txHash,
    });
    expect(txReceipt.status).toBe('success');
    console.log(
      `Permitted App with ID ${TEST_CONFIG.appId} and version ${TEST_CONFIG.appVersion} for Agent Wallet PKP with token id ${TEST_CONFIG.userPkp!.tokenId}\nTx hash: ${txHash}`,
    );
  });

  it('should fund TEST_APP_DELEGATEE if they have no Lit test tokens', async () => {
    const balance = await DATIL_PUBLIC_CLIENT.getBalance({
      address: TEST_APP_DELEGATEE_ACCOUNT.address,
    });
    if (balance === 0n) {
      const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.sendTransaction({
        to: TEST_APP_DELEGATEE_ACCOUNT.address,
        value: BigInt(10000000000000000), // 0.01 ETH in wei
      });
      const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: txHash,
      });
      console.log(`Funded TEST_APP_DELEGATEE with 0.01 ETH\nTx hash: ${txHash}`);
      expect(txReceipt.status).toBe('success');
    } else {
      expect(balance).toBeGreaterThan(0n);
    }
  });

  // Test cases for policy failure tools
  describe('Policy failure tools - Evaluate', () => {
    // evaluateDenyThrowError - Policy throws an error during evaluation
    describe('evaluateDenyThrowError', () => {
      it('should fail due to policy throwing an error during evaluation', async () => {
        const client = getEvaluateDenyThrowErrorToolClient();
        const result = await client.execute(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(result.context?.policiesContext?.allow).toBe(false);
        expect(result.context?.policiesContext?.deniedPolicy?.packageName).toBe(
          '@lit-protocol/evaluateDenyThrowError',
        );
        if (result.context?.policiesContext?.allow === false) {
          const deniedPolicy = result.context?.policiesContext?.deniedPolicy;
          expect(deniedPolicy.error).toBeDefined();
        }
      });
    });

    // evaluateDenyWithSchema - Policy denies during evaluation with schema
    describe('evaluateDenyWithSchema', () => {
      it('should fail due to policy denying during evaluation with schema', async () => {
        const client = getEvaluateDenyWithSchemaToolClient();
        const result = await client.execute(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(result.context?.policiesContext?.allow).toBe(false);
        expect(result.context?.policiesContext?.deniedPolicy?.packageName).toBe(
          '@lit-protocol/evaluateDenyWithSchema',
        );
        expect(result.context?.policiesContext?.deniedPolicy?.result?.reason).toBeDefined();
      });
    });

    // evaluateDenyNoSchemaErrorResult - Policy denies during evaluation with no schema and error result
    describe('evaluateDenyNoSchemaErrorResult', () => {
      it('should fail due to policy denying during evaluation with no schema and error result', async () => {
        const client = getEvaluateDenyNoSchemaErrorResultToolClient();
        const result = await client.execute(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(result.context?.policiesContext?.allow).toBe(false);
        expect(result.context?.policiesContext?.deniedPolicy?.packageName).toBe(
          '@lit-protocol/evaluateDenyNoSchemaErrorResult',
        );
        if (result.context?.policiesContext?.allow === false) {
          const deniedPolicy = result.context?.policiesContext?.deniedPolicy;
          expect(deniedPolicy.error).toBeDefined();
        }
      });
    });

    // evaluateDenyNoSchemaNoResult - Policy denies during evaluation with no schema and no result
    describe('evaluateDenyNoSchemaNoResult', () => {
      it('should fail due to policy denying during evaluation with no schema and no result', async () => {
        const client = getEvaluateDenyNoSchemaNoResultToolClient();
        const result = await client.execute(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(result.context?.policiesContext?.allow).toBe(false);
        expect(result.context?.policiesContext?.deniedPolicy?.packageName).toBe(
          '@lit-protocol/evaluateDenyNoSchemaNoResult',
        );
        expect(result.context?.policiesContext?.deniedPolicy?.result).toBeUndefined();
      });
    });
  });

  // Test cases for policy failure tools - Precheck
  describe('Policy failure tools - Precheck', () => {
    // precheckDenyThrowError - Policy throws an error during precheck
    describe('precheckDenyThrowError', () => {
      it('should fail due to policy throwing an error during precheck', async () => {
        const client = getPrecheckDenyThrowErrorToolClient();
        const result = await client.precheck(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(result.context?.policiesContext?.allow).toBe(false);
        expect(result.context?.policiesContext?.deniedPolicy?.packageName).toBe(
          '@lit-protocol/precheckDenyThrowError',
        );
        if (result.context?.policiesContext?.allow === false) {
          const deniedPolicy = result.context?.policiesContext?.deniedPolicy;
          expect(deniedPolicy.error).toBeDefined();
        }
      });
    });

    // precheckDenyWithSchema - Policy denies during precheck with schema
    describe('precheckDenyWithSchema', () => {
      it('should fail due to policy denying during precheck with schema', async () => {
        const client = getPrecheckDenyWithSchemaToolClient();
        const result = await client.precheck(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(result.context?.policiesContext?.allow).toBe(false);
        expect(result.context?.policiesContext?.deniedPolicy?.packageName).toBe(
          '@lit-protocol/precheckDenyWithSchema',
        );
        if (result.context?.policiesContext?.allow === false) {
          if (
            result.context?.policiesContext?.deniedPolicy.packageName ===
            '@lit-protocol/precheckDenyWithSchema'
          ) {
            const deniedPolicy = result.context?.policiesContext?.deniedPolicy;
            expect(deniedPolicy.result?.reason).toBeDefined();
          }
        }
      });
    });

    // precheckDenyNoSchemaErrorResult - Policy denies during precheck with no schema and error result
    describe('precheckDenyNoSchemaErrorResult', () => {
      it('should fail due to policy denying during precheck with no schema and error result', async () => {
        const client = getPrecheckDenyNoSchemaErrorResultToolClient();
        const result = await client.precheck(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(result.context?.policiesContext?.allow).toBe(false);
        expect(result.context?.policiesContext?.deniedPolicy?.packageName).toBe(
          '@lit-protocol/precheckDenyNoSchemaErrorResult',
        );

        if (result.context?.policiesContext?.allow === false) {
          const deniedPolicy = result.context?.policiesContext?.deniedPolicy;
          expect(deniedPolicy.error).toBeDefined();
        }
      });
    });

    // precheckDenyNoSchemaNoResult - Policy denies during precheck with no schema and no result
    describe('precheckDenyNoSchemaNoResult', () => {
      it('should fail due to policy denying during precheck with no schema and no result', async () => {
        const client = getPrecheckDenyNoSchemaNoResultToolClient();
        const result = await client.precheck(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(result.context?.policiesContext?.allow).toBe(false);
        expect(result.context?.policiesContext?.deniedPolicy?.packageName).toBe(
          '@lit-protocol/precheckDenyNoSchemaNoResult',
        );
        expect(result.context?.policiesContext?.deniedPolicy?.result).toBeUndefined();
      });
    });
  });
});
