import { formatEther } from 'viem';

import {
  disconnectVincentToolClients,
  getVincentToolClient,
} from '@lit-protocol/vincent-app-sdk/toolClient';
import { ethers } from 'ethers';
import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';

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

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

// Function moved to setup-fixtures.ts

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
  // Define permission data for all tools and policies
  const PERMISSION_DATA: PermissionData = {
    // Evaluate policy failure tools
    [evaluateDenyThrowErrorTool.ipfsCid]: {
      [evaluateDenyThrowErrorMetadata.ipfsCid]: {
        y: 'test-value',
      },
    },
    [evaluateDenyWithSchemaTool.ipfsCid]: {
      [evaluateDenyWithSchemaMetadata.ipfsCid]: {
        y: 'test-value',
      },
    },
    [evaluateDenyNoSchemaErrorResultTool.ipfsCid]: {
      [evaluateDenyNoSchemaErrorResultMetadata.ipfsCid]: {
        y: 'test-value',
      },
    },
    [evaluateDenyNoSchemaNoResultTool.ipfsCid]: {
      [evaluateDenyNoSchemaNoResultMetadata.ipfsCid]: {
        y: 'test-value',
      },
    },

    // Precheck policy failure tools
    [precheckDenyThrowErrorTool.ipfsCid]: {
      [precheckDenyThrowErrorMetadata.ipfsCid]: {
        y: 'test-value',
      },
    },
    [precheckDenyWithSchemaTool.ipfsCid]: {
      [precheckDenyWithSchemaMetadata.ipfsCid]: {
        y: 'test-value',
      },
    },
    [precheckDenyNoSchemaErrorResultTool.ipfsCid]: {
      [precheckDenyNoSchemaErrorResultMetadata.ipfsCid]: {
        y: 'test-value',
      },
    },
    [precheckDenyNoSchemaNoResultTool.ipfsCid]: {
      [precheckDenyNoSchemaNoResultMetadata.ipfsCid]: {
        y: 'test-value',
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
          expect(deniedPolicy.runtimeError).toBeDefined();
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
          expect(deniedPolicy.runtimeError).toBeDefined();
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
          expect(deniedPolicy.runtimeError).toBeDefined();
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
          expect(deniedPolicy.runtimeError).toBeDefined();
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
