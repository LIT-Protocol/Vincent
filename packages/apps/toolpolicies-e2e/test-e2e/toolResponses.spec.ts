import { formatEther } from 'viem';

import {
  disconnectVincentToolClients,
  getVincentToolClient,
} from '@lit-protocol/vincent-app-sdk/toolClient';

import { ethers } from 'ethers';
import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';

// Import all bundled Vincent tools from the generated directory
// Failure tools with schema
import { bundledVincentTool as executeFailWithSchemaTool } from '../src/generated/tools/fail/withSchema/executeFailWithSchema/vincent-bundled-tool';
import { bundledVincentTool as precheckFailWithSchemaTool } from '../src/generated/tools/fail/withSchema/precheckFailWithSchema/vincent-bundled-tool';

// Failure tools with no schema
import { bundledVincentTool as executeFailNoSchemaErrorResultTool } from '../src/generated/tools/fail/noSchema/executeFailNoSchemaErrorResult/vincent-bundled-tool';
import { bundledVincentTool as executeFailNoSchemaNoResultTool } from '../src/generated/tools/fail/noSchema/executeFailNoSchemaNoResult/vincent-bundled-tool';
import { bundledVincentTool as precheckFailNoSchemaErrorResultTool } from '../src/generated/tools/fail/noSchema/precheckFailNoSchemaErrorResult/vincent-bundled-tool';
import { bundledVincentTool as precheckFailNoSchemaNoResultTool } from '../src/generated/tools/fail/noSchema/precheckFailNoSchemaNoResult/vincent-bundled-tool';

// Throw error tools
import { bundledVincentTool as executeFailThrowErrorTool } from '../src/generated/tools/fail/noSchema/executeFailThrowError/vincent-bundled-tool';
import { bundledVincentTool as precheckFailThrowErrorTool } from '../src/generated/tools/fail/noSchema/precheckFailThrowError/vincent-bundled-tool';

// Success tools
import { bundledVincentTool as executeSuccessNoSchemaTool } from '../src/generated/tools/success/noSchema/executeSuccessNoSchema/vincent-bundled-tool';
import { bundledVincentTool as executeSuccessWithSchemaTool } from '../src/generated/tools/success/withSchema/executeSuccessWithSchema/vincent-bundled-tool';
import { bundledVincentTool as precheckSuccessNoSchemaTool } from '../src/generated/tools/success/noSchema/precheckSuccessNoSchema/vincent-bundled-tool';
import { bundledVincentTool as precheckSuccessWithSchemaTool } from '../src/generated/tools/success/withSchema/precheckSuccessWithSchema/vincent-bundled-tool';

// Testing invalid results schemaValidationError
import { bundledVincentTool as executeFailInvalidSchemaTool } from '../src/generated/tools/fail/invalidSchema/executeFailInvalidSchema/vincent-bundled-tool';
import { bundledVincentTool as executeSuccessInvalidSchemaTool } from '../src/generated/tools/fail/invalidSchema/executeSuccessInvalidSchema/vincent-bundled-tool';
import { bundledVincentTool as precheckFailInvalidSchemaTool } from '../src/generated/tools/fail/invalidSchema/precheckFailInvalidSchema/vincent-bundled-tool';
import { bundledVincentTool as precheckSuccessInvalidSchemaTool } from '../src/generated/tools/fail/invalidSchema/precheckSuccessInvalidSchema/vincent-bundled-tool';

// Tool with policy that returns precheck results
import { bundledVincentTool as precheckSuccessWithPolicyTool } from '../src/generated/tools/withPolicySuccess/precheckSuccessWithPolicy/vincent-bundled-tool';
import precheckAllowWithUserParamsMetadata from '../src/generated/policies/allow/withSchema/precheckAllowWithUserParams/vincent-policy-metadata.json';

import {
  checkShouldMintAndFundPkp,
  DATIL_PUBLIC_CLIENT,
  getTestConfig,
  TEST_APP_DELEGATEE_PRIVATE_KEY,
  TEST_APP_MANAGER_PRIVATE_KEY,
  TEST_CONFIG_PATH,
  TestConfig,
  YELLOWSTONE_RPC_URL,
} from './helpers';
import {
  fundAppDelegateeIfNeeded,
  permitAppVersionForAgentWalletPkp,
  permitToolsForAgentWalletPkp,
  registerNewApp,
  removeAppDelegateeIfNeeded,
} from './helpers/setup-fixtures';

import { checkShouldMintCapacityCredit } from './helpers/check-mint-capcity-credit';
import { privateKeyToAccount } from 'viem/accounts';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

function hasError(result: any): boolean {
  return result && !!result.runtimeError;
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

// Tools that return invalid results
const getExecuteFailInvalidSchemaToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: executeFailInvalidSchemaTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getExecuteSuccessInvalidSchemaToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: executeSuccessInvalidSchemaTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckFailInvalidSchemaToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: precheckFailInvalidSchemaTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckSuccessInvalidSchemaToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: precheckSuccessInvalidSchemaTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckSuccessWithPolicyToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: precheckSuccessWithPolicyTool,
    ethersSigner: getDelegateeWallet(),
  });
};

describe('VincentToolClient failure tests', () => {
  // Define permission data for all tools and policies
  const PERMISSION_DATA: PermissionData = {
    // Failure tools
    [executeFailNoSchemaErrorResultTool.ipfsCid]: {},
    [executeFailNoSchemaNoResultTool.ipfsCid]: {},
    [executeFailWithSchemaTool.ipfsCid]: {},
    [precheckFailNoSchemaErrorResultTool.ipfsCid]: {},
    [precheckFailNoSchemaNoResultTool.ipfsCid]: {},
    [precheckFailWithSchemaTool.ipfsCid]: {},
    [executeFailThrowErrorTool.ipfsCid]: {},
    [precheckFailThrowErrorTool.ipfsCid]: {},

    // Success tools
    [executeSuccessNoSchemaTool.ipfsCid]: {},
    [executeSuccessWithSchemaTool.ipfsCid]: {},
    [precheckSuccessNoSchemaTool.ipfsCid]: {},
    [precheckSuccessWithSchemaTool.ipfsCid]: {},

    // Tools that return invalid results and so fail schema validation
    [executeFailInvalidSchemaTool.ipfsCid]: {},
    [executeSuccessInvalidSchemaTool.ipfsCid]: {},
    [precheckFailInvalidSchemaTool.ipfsCid]: {},
    [precheckSuccessInvalidSchemaTool.ipfsCid]: {},

    // Tool with policy that returns precheck results
    [precheckSuccessWithPolicyTool.ipfsCid]: {
      [precheckAllowWithUserParamsMetadata.ipfsCid]: {
        y: 'test-policy-param',
      },
    },
  };

  // An array of the IPFS cid of each tool to be tested, computed from the keys of PERMISSION_DATA
  const TOOL_IPFS_IDS: string[] = Object.keys(PERMISSION_DATA);

  // Define the policies for each tool, computed from TOOL_IPFS_IDS and PERMISSION_DATA
  const TOOL_POLICIES = TOOL_IPFS_IDS.map((toolIpfsCid) => {
    // Get the policy IPFS CIDs for this tool from PERMISSION_DATA
    return Object.keys(PERMISSION_DATA[toolIpfsCid]);
  });

  let TEST_CONFIG: TestConfig;

  afterAll(async () => {
    console.log('Disconnecting from Lit node client...');
    await disconnectVincentToolClients();
  });

  beforeAll(async () => {
    TEST_CONFIG = getTestConfig(TEST_CONFIG_PATH);
    TEST_CONFIG = await checkShouldMintAndFundPkp(TEST_CONFIG);
    TEST_CONFIG = await checkShouldMintCapacityCredit(TEST_CONFIG);

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
  });

  it('should permit all of the tools for the Agent Wallet PKP', async () => {
    await permitToolsForAgentWalletPkp(TOOL_IPFS_IDS, TEST_CONFIG);
  });

  it('should remove TEST_APP_DELEGATEE_ACCOUNT from an existing App if needed', async () => {
    await removeAppDelegateeIfNeeded();
  });

  it('should register a new App', async () => {
    TEST_CONFIG = await registerNewApp(TOOL_IPFS_IDS, TOOL_POLICIES, TEST_CONFIG, TEST_CONFIG_PATH);
  });

  it('should permit the App version for the Agent Wallet PKP', async () => {
    await permitAppVersionForAgentWalletPkp(PERMISSION_DATA, TEST_CONFIG);
  });

  it('should fund TEST_APP_DELEGATEE if they have no Lit test tokens', async () => {
    await fundAppDelegateeIfNeeded();
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
        if (result.success === false) {
          expect(result.runtimeError).toContain('Invalid execute result');
          expect(result.schemaValidationError).toBeTruthy();
        }
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
        if (result.success === false) {
          expect(result.runtimeError).toContain('Invalid precheck result');
          expect(result.schemaValidationError).toBeTruthy();
        }
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
        expect(hasError(result)).toBe(false);
        if (result.success === false) {
          expect(result.result?.err).toContain('Intentional failure with schema');
        }
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
        if (result.success === false) {
          expect(result.runtimeError).toContain('Intentional execute failure with thrown error');
        }
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
        if (result.success === false) {
          expect(result.runtimeError).toContain('Intentional precheck failure with thrown error');
        }
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
  // Test cases for invalid parameters
  describe('Invalid parameters tests', () => {
    // Test calling executeSuccessWithSchema with invalid parameters
    describe('executeSuccessWithSchema with invalid parameters', () => {
      it('should fail with schema validation error when called with invalid parameters', async () => {
        const client = getExecuteSuccessWithSchemaToolClient();
        // Call with a number instead of a string for 'x'
        const result = await client.execute(
          { x: 42 as any }, // Invalid: x should be a string
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        if (result.success == false) {
          expect(result.schemaValidationError).toBeDefined();
          expect(result.schemaValidationError?.phase).toBe('execute');
          expect(result.schemaValidationError?.stage).toBe('input');
          expect(result.schemaValidationError?.zodError).toBeDefined();
        }
      });
    });

    // Test calling precheckSuccessWithSchema with invalid parameters
    describe('precheckSuccessWithSchema with invalid parameters', () => {
      it('should fail with schema validation error when called with invalid parameters', async () => {
        const client = getPrecheckSuccessWithSchemaToolClient();
        // Call with an object that doesn't have 'x' property
        const result = await client.precheck(
          { y: 'invalid-param' } as any, // Invalid: missing 'x' property
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        if (result.success == false) {
          expect(result.schemaValidationError).toBeDefined();
          expect(result.schemaValidationError?.phase).toBe('precheck');
          expect(result.schemaValidationError?.stage).toBe('input');
          expect(result.schemaValidationError?.zodError).toBeDefined();
        }
      });
    });
  });

  // Test cases for invalid results
  describe('Invalid results tests', () => {
    // Test executeFailInvalidSchema - Execute should fail with schema validation error
    describe('executeFailInvalidSchema', () => {
      it('should fail with schema validation error when returning invalid result', async () => {
        const client = getExecuteFailInvalidSchemaToolClient();
        const result = await client.execute(
          { x: 'test-value' },
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        if (result.success == false) {
          expect(result.schemaValidationError).toBeDefined();
          expect(result.schemaValidationError?.phase).toBe('execute');
          expect(result.schemaValidationError?.stage).toBe('output');
          expect(result.schemaValidationError?.zodError).toBeDefined();
        }
      });
    });

    // Test executeSuccessInvalidSchema - Execute should fail with schema validation error
    describe('executeSuccessInvalidSchema', () => {
      it('should fail with schema validation error when returning invalid result', async () => {
        const client = getExecuteSuccessInvalidSchemaToolClient();
        const result = await client.execute(
          { x: 'test-value' },
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        if (result.success == false) {
          expect(result.schemaValidationError).toBeDefined();
          expect(result.schemaValidationError?.phase).toBe('execute');
          expect(result.schemaValidationError?.stage).toBe('output');
          expect(result.schemaValidationError?.zodError).toBeDefined();
        }
      });
    });

    // Test precheckFailInvalidSchema - Precheck should fail with schema validation error
    describe('precheckFailInvalidSchema', () => {
      it('should fail with schema validation error when returning invalid result', async () => {
        const client = getPrecheckFailInvalidSchemaToolClient();
        const result = await client.precheck(
          { x: 'test-value' },
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        if (result.success == false) {
          expect(result.schemaValidationError).toBeDefined();
          expect(result.schemaValidationError?.phase).toBe('precheck');
          expect(result.schemaValidationError?.stage).toBe('output');
          expect(result.schemaValidationError?.zodError).toBeDefined();
        }
      });

      it('should succeed execute', async () => {
        const client = getPrecheckFailInvalidSchemaToolClient();
        const result = await client.execute(
          { x: 'test-value' },
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(true);
        expect(result.result).toBeDefined();
        expect(result.result?.ok).toBe(true);
      });
    });

    // Test precheckSuccessInvalidSchema - Precheck should fail with schema validation error
    describe('precheckSuccessInvalidSchema', () => {
      it('should fail with schema validation error when returning invalid result', async () => {
        const client = getPrecheckSuccessInvalidSchemaToolClient();
        const result = await client.precheck(
          { x: 'test-value' },
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        if (result.success == false) {
          expect(result.schemaValidationError).toBeDefined();
          expect(result.schemaValidationError?.phase).toBe('precheck');
          expect(result.schemaValidationError?.stage).toBe('output');
          expect(result.schemaValidationError?.zodError).toBeDefined();
        }
      });

      it('should fail execute with schema', async () => {
        const client = getPrecheckSuccessInvalidSchemaToolClient();
        const result = await client.execute(
          { x: 'test-value' },
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(result.success).toBe(false);
        if (result.success == false) {
          expect(result.result?.err).toBeDefined();
          expect(result.result?.err).toContain('Intentional failure with schema');
        }
      });
    });
  });

  // Test case for verifying policy precheck results are properly propagated
  describe('Policy precheck result propagation', () => {
    it('should include policy precheck allow results when policies return data', async () => {
      const client = getPrecheckSuccessWithPolicyToolClient();
      const result = await client.precheck(
        { x: 'test-value' },
        {
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        },
      );

      // Verify the precheck succeeded
      expect(result.success).toBe(true);
      expect(result.result).toEqual({ ok: true });

      // Verify the context and policiesContext structure
      expect(result.context).toBeDefined();
      expect(result.context?.policiesContext).toBeDefined();

      // Verify the policy was allowed
      const policiesContext = result.context?.policiesContext;
      expect(policiesContext?.allow).toBe(true);
      expect(Array.isArray(policiesContext?.evaluatedPolicies)).toBe(true);
      expect(policiesContext?.evaluatedPolicies).toEqual(['@lit-protocol/test-policy@1.0.0']);

      // Verify the policy result is properly populated
      const allowedPolicies = policiesContext?.allowedPolicies;
      expect(allowedPolicies).toBeDefined();
      expect(typeof allowedPolicies).toBe('object');
      expect(allowedPolicies?.['@lit-protocol/test-policy@1.0.0']).toBeDefined();

      const policyResult = allowedPolicies?.['@lit-protocol/test-policy@1.0.0'] as {
        result: { ok: boolean };
      };
      expect(policyResult).toBeDefined();
      expect(policyResult.result).toEqual({ ok: true });
    });
  });
});
