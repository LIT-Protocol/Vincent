import { formatEther, parseEventLogs } from 'viem';

import { getVincentToolClient, disconnectVincentToolClients } from '@lit-protocol/vincent-app-sdk';
import { ethers } from 'ethers';

// Import all bundled Vincent tools from the generated directory
// Failure tools
import { bundledVincentTool as executeFailNoSchemaErrorResultTool } from '../src/generated/executeFailNoSchemaErrorResult/vincent-bundled-tool';
import { bundledVincentTool as executeFailNoSchemaNoResultTool } from '../src/generated/executeFailNoSchemaNoResult/vincent-bundled-tool';
import { bundledVincentTool as executeFailWithSchemaTool } from '../src/generated/executeFailWithSchema/vincent-bundled-tool';
import { bundledVincentTool as precheckFailNoSchemaErrorResultTool } from '../src/generated/precheckFailNoSchemaErrorResult/vincent-bundled-tool';
import { bundledVincentTool as precheckFailNoSchemaNoResultTool } from '../src/generated/precheckFailNoSchemaNoResult/vincent-bundled-tool';
import { bundledVincentTool as precheckFailWithSchemaTool } from '../src/generated/precheckFailWithSchema/vincent-bundled-tool';

// Throw error tools
import { bundledVincentTool as executeFailThrowErrorTool } from '../src/generated/executeFailThrowError/vincent-bundled-tool';
import { bundledVincentTool as precheckFailThrowErrorTool } from '../src/generated/precheckFailThrowError/vincent-bundled-tool';

// Success tools
import { bundledVincentTool as executeSuccessNoSchemaTool } from '../src/generated/executeSuccessNoSchema/vincent-bundled-tool';
import { bundledVincentTool as executeSuccessWithSchemaTool } from '../src/generated/executeSuccessWithSchema/vincent-bundled-tool';
import { bundledVincentTool as precheckSuccessNoSchemaTool } from '../src/generated/precheckSuccessNoSchema/vincent-bundled-tool';
import { bundledVincentTool as precheckSuccessWithSchemaTool } from '../src/generated/precheckSuccessWithSchema/vincent-bundled-tool';

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

function hasError(result: any): boolean {
  return result && 'error' in result;
}

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
// Failure tools
const getExecuteFailNoSchemaErrorResultToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: executeFailNoSchemaErrorResultTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getExecuteFailNoSchemaNoResultToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: executeFailNoSchemaNoResultTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getExecuteFailWithSchemaToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: executeFailWithSchemaTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckFailNoSchemaErrorResultToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: precheckFailNoSchemaErrorResultTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckFailNoSchemaNoResultToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: precheckFailNoSchemaNoResultTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckFailWithSchemaToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: precheckFailWithSchemaTool,
    ethersSigner: getDelegateeWallet(),
  });
};

// Helper functions for throw error tools
const getExecuteFailThrowErrorToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: executeFailThrowErrorTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckFailThrowErrorToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: precheckFailThrowErrorTool,
    ethersSigner: getDelegateeWallet(),
  });
};

// Success tools

const getExecuteSuccessNoSchemaToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: executeSuccessNoSchemaTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getExecuteSuccessWithSchemaToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: executeSuccessWithSchemaTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckSuccessNoSchemaToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: precheckSuccessNoSchemaTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckSuccessWithSchemaToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: precheckSuccessWithSchemaTool,
    ethersSigner: getDelegateeWallet(),
  });
};

describe('VincentToolClient failure tests', () => {
  // An array of the IPFS cid of each tool to be tested. Can be read from each BundledVincentTool
  const TOOL_IPFS_IDS: string[] = [
    // Failure tools
    executeFailNoSchemaErrorResultTool.ipfsCid,
    executeFailNoSchemaNoResultTool.ipfsCid,
    executeFailWithSchemaTool.ipfsCid,
    precheckFailNoSchemaErrorResultTool.ipfsCid,
    precheckFailNoSchemaNoResultTool.ipfsCid,
    precheckFailWithSchemaTool.ipfsCid,
    executeFailThrowErrorTool.ipfsCid,
    precheckFailThrowErrorTool.ipfsCid,
    // Success tools
    executeSuccessNoSchemaTool.ipfsCid,
    executeSuccessWithSchemaTool.ipfsCid,
    precheckSuccessNoSchemaTool.ipfsCid,
    precheckSuccessWithSchemaTool.ipfsCid,
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
    // in order to execute the ERC20 Approval and Uniswap Swap Tools
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
    // in order to interact with the Vincent contract
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

          // No policies on these tools. Empty array for all policy related data.
          toolPolicies: TOOL_IPFS_IDS.map(() => []),
          toolPolicyParameterNames: TOOL_IPFS_IDS.map(() => []),
          toolPolicyParameterTypes: TOOL_IPFS_IDS.map(() => []),
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

        // No policies on these tools. Empty array for all policy related data.
        TOOL_IPFS_IDS.map(() => []),
        TOOL_IPFS_IDS.map(() => []),
        TOOL_IPFS_IDS.map(() => []),
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

  // Test cases for failure tools
  describe('Failure tools', () => {
    // executeFailWithSchema - Execute should fail with schema
    describe('executeFailWithSchema', () => {
      it('should fail execute with schema', async () => {
        const client = getExecuteFailWithSchemaToolClient();
        const result = await client.execute(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(result.result?.err).toBeDefined();
        expect(result.result?.err).toContain('Intentional failure with schema');
      });
    });

    // precheckFailWithSchema - Precheck should fail with schema
    describe('precheckFailWithSchema', () => {
      it('should fail precheck with schema', async () => {
        const client = getPrecheckFailWithSchemaToolClient();
        const result = await client.precheck(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(result.result?.err).toBeDefined();
        expect(result.result?.err).toContain('Intentional precheck failure with schema');
      });

      it('should succeed execute', async () => {
        const client = getPrecheckFailWithSchemaToolClient();
        const result = await client.execute(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(true);
      });
    });

    // executeFailNoSchemaNoResult - Execute should fail without schema and no result
    describe('executeFailNoSchemaNoResult', () => {
      it('should fail execute without schema and no result', async () => {
        const client = getExecuteFailNoSchemaNoResultToolClient();
        const result = await client.execute(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(hasError(result)).not.toBe(true);
      });
    });

    // precheckFailNoSchemaNoResult - Precheck should fail without schema and no result
    describe('precheckFailNoSchemaNoResult', () => {
      it('should fail precheck without schema and no result', async () => {
        const client = getPrecheckFailNoSchemaNoResultToolClient();
        const result = await client.precheck(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(hasError(result)).not.toBe(true);
      });

      it('should fail execute with schema', async () => {
        const client = getPrecheckFailNoSchemaNoResultToolClient();
        const result = await client.execute(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(result.result?.err).toBeDefined();
        expect(result.result?.err).toContain('Intentional failure with schema');
      });
    });

    // executeFailNoSchemaErrorResult - Execute should fail without schema but with error message
    describe('executeFailNoSchemaErrorResult', () => {
      it('should fail execute without schema but with error message', async () => {
        const client = getExecuteFailNoSchemaErrorResultToolClient();
        const result = await client.execute(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(hasError(result)).toBe(true);
        expect((result as any).error).toContain('Intentional execute failure with error message');
      });
    });

    // precheckFailNoSchemaErrorResult - Precheck should fail without schema but with error message
    describe('precheckFailNoSchemaErrorResult', () => {
      it('should fail precheck without schema but with error message', async () => {
        const client = getPrecheckFailNoSchemaErrorResultToolClient();
        const result = await client.precheck(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(hasError(result)).toBe(true);

        expect((result as any).error).toContain('Intentional precheck failure with error message');
      });

      it('should fail execute with schema', async () => {
        const client = getPrecheckFailNoSchemaErrorResultToolClient();
        const result = await client.execute(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(result.result?.err).toBeDefined();
        expect(result.result?.err).toContain('Intentional failure with schema');
      });
    });

    // executeFailThrowError - Execute should throw an error
    describe('executeFailThrowError', () => {
      it('should fail execute with thrown error', async () => {
        const client = getExecuteFailThrowErrorToolClient();
        const result = await client.execute(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(hasError(result)).toBe(true);
        expect((result as any).error).toContain('Intentional execute failure with thrown error');
      });
    });

    // precheckFailThrowError - Precheck should throw an error
    describe('precheckFailThrowError', () => {
      it('should fail precheck with thrown error', async () => {
        const client = getPrecheckFailThrowErrorToolClient();
        const result = await client.precheck(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(hasError(result)).toBe(true);

        expect((result as any).error).toContain('Intentional precheck failure with thrown error');
      });

      it('should fail execute with schema', async () => {
        const client = getPrecheckFailThrowErrorToolClient();
        const result = await client.execute(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(result.result?.err).toBeDefined();
        expect(result.result?.err).toContain('Intentional failure with schema');
      });
    });
  });

  // Test cases for success tools
  describe('Success tools', () => {
    // executeSuccessWithSchema - Execute should succeed with schema
    describe('executeSuccessWithSchema', () => {
      it('should succeed execute with schema', async () => {
        const client = getExecuteSuccessWithSchemaToolClient();
        const result = await client.execute(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(true);
        expect(result.result).toBeDefined();
        expect(result.result?.ok).toBe(true);
      });
    });

    // precheckSuccessWithSchema - Precheck should succeed with schema
    describe('precheckSuccessWithSchema', () => {
      it('should succeed precheck with schema', async () => {
        const client = getPrecheckSuccessWithSchemaToolClient();
        const result = await client.precheck(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(true);
        expect(result.result).toBeDefined();
        expect(result.result?.ok).toBe(true);
      });

      it('should succeed execute without schema', async () => {
        const client = getPrecheckSuccessWithSchemaToolClient();
        const result = await client.execute(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(true);
      });
    });

    // executeSuccessNoSchema - Execute should succeed without schema
    describe('executeSuccessNoSchema', () => {
      it('should succeed execute without schema', async () => {
        const client = getExecuteSuccessNoSchemaToolClient();
        const result = await client.execute(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(true);
      });
    });

    // precheckSuccessNoSchema - Precheck should succeed without schema
    describe('precheckSuccessNoSchema', () => {
      it('should succeed precheck without schema', async () => {
        const client = getPrecheckSuccessNoSchemaToolClient();
        const result = await client.precheck(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(true);
      });

      it('should succeed execute with schema', async () => {
        const client = getPrecheckSuccessNoSchemaToolClient();
        const result = await client.execute(
          { x: 'test-value' }, // toolParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(true);
        expect(result.result).toBeDefined();
        expect(result.result?.ok).toBe(true);
      });
    });
  });
});
