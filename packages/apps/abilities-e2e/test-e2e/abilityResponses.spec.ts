import { formatEther } from 'viem';

import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';

console.log({ getVincentToolClient });
import { ethers } from 'ethers';
import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';

// Import all bundled Vincent abilities from the generated directory
// Failure abilities with schema
import { bundledVincentAbility as executeFailWithSchemaAbility } from '../src/generated/abilities/fail/withSchema/executeFailWithSchema/vincent-bundled-ability';
import { bundledVincentAbility as precheckFailWithSchemaAbility } from '../src/generated/abilities/fail/withSchema/precheckFailWithSchema/vincent-bundled-ability';

// Failure abilities with no schema
import { bundledVincentAbility as executeFailNoSchemaErrorResultAbility } from '../src/generated/abilities/fail/noSchema/executeFailNoSchemaErrorResult/vincent-bundled-ability';
import { bundledVincentAbility as executeFailNoSchemaNoResultAbility } from '../src/generated/abilities/fail/noSchema/executeFailNoSchemaNoResult/vincent-bundled-ability';
import { bundledVincentAbility as precheckFailNoSchemaErrorResultAbility } from '../src/generated/abilities/fail/noSchema/precheckFailNoSchemaErrorResult/vincent-bundled-ability';
import { bundledVincentAbility as precheckFailNoSchemaNoResultAbility } from '../src/generated/abilities/fail/noSchema/precheckFailNoSchemaNoResult/vincent-bundled-ability';

// Throw error abilities
import { bundledVincentAbility as executeFailThrowErrorAbility } from '../src/generated/abilities/fail/noSchema/executeFailThrowError/vincent-bundled-ability';
import { bundledVincentAbility as precheckFailThrowErrorAbility } from '../src/generated/abilities/fail/noSchema/precheckFailThrowError/vincent-bundled-ability';

// Success abilities
import { bundledVincentAbility as executeSuccessNoSchemaAbility } from '../src/generated/abilities/success/noSchema/executeSuccessNoSchema/vincent-bundled-ability';
import { bundledVincentAbility as executeSuccessWithSchemaAbility } from '../src/generated/abilities/success/withSchema/executeSuccessWithSchema/vincent-bundled-ability';
import { bundledVincentAbility as precheckSuccessNoSchemaAbility } from '../src/generated/abilities/success/noSchema/precheckSuccessNoSchema/vincent-bundled-ability';
import { bundledVincentAbility as precheckSuccessWithSchemaAbility } from '../src/generated/abilities/success/withSchema/precheckSuccessWithSchema/vincent-bundled-ability';

// Testing invalid results schemaValidationError
import { bundledVincentAbility as executeFailInvalidSchemaAbility } from '../src/generated/abilities/fail/invalidSchema/executeFailInvalidSchema/vincent-bundled-ability';
import { bundledVincentAbility as executeSuccessInvalidSchemaAbility } from '../src/generated/abilities/fail/invalidSchema/executeSuccessInvalidSchema/vincent-bundled-ability';
import { bundledVincentAbility as precheckFailInvalidSchemaAbility } from '../src/generated/abilities/fail/invalidSchema/precheckFailInvalidSchema/vincent-bundled-ability';
import { bundledVincentAbility as precheckSuccessInvalidSchemaAbility } from '../src/generated/abilities/fail/invalidSchema/precheckSuccessInvalidSchema/vincent-bundled-ability';

// Ability with policy that returns precheck results
import { bundledVincentAbility as precheckSuccessWithPolicyAbility } from '../src/generated/abilities/withPolicySuccess/precheckSuccessWithPolicy/vincent-bundled-ability';
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
  permitAbilitiesForAgentWalletPkp,
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

// Create a delegatee wallet for ability execution; used as `ethersSigner` for `getVincentAbilityClient()` for each ability to be tested.
const getDelegateeWallet = () => {
  return new ethers.Wallet(
    TEST_APP_DELEGATEE_PRIVATE_KEY as string,
    new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
  );
};

// Helper functions to get a VincentAbilityClient for each ability
// Failure abilities
const getExecuteFailNoSchemaErrorResultAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: executeFailNoSchemaErrorResultAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getExecuteFailNoSchemaNoResultAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: executeFailNoSchemaNoResultAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getExecuteFailWithSchemaAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: executeFailWithSchemaAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckFailNoSchemaErrorResultAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: precheckFailNoSchemaErrorResultAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckFailNoSchemaNoResultAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: precheckFailNoSchemaNoResultAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckFailWithSchemaAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: precheckFailWithSchemaAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

// Helper functions for throw error abilities
const getExecuteFailThrowErrorAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: executeFailThrowErrorAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckFailThrowErrorAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: precheckFailThrowErrorAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

// Success abilities

const getExecuteSuccessNoSchemaAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: executeSuccessNoSchemaAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getExecuteSuccessWithSchemaAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: executeSuccessWithSchemaAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckSuccessNoSchemaAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: precheckSuccessNoSchemaAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckSuccessWithSchemaAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: precheckSuccessWithSchemaAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

// Abilities that return invalid results
const getExecuteFailInvalidSchemaAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: executeFailInvalidSchemaAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getExecuteSuccessInvalidSchemaAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: executeSuccessInvalidSchemaAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckFailInvalidSchemaAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: precheckFailInvalidSchemaAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckSuccessInvalidSchemaAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: precheckSuccessInvalidSchemaAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckSuccessWithPolicyAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: precheckSuccessWithPolicyAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

describe('VincentAbilityClient failure tests', () => {
  // Define permission data for all abilities and policies
  const PERMISSION_DATA: PermissionData = {
    // Failure abilities
    [executeFailNoSchemaErrorResultAbility.ipfsCid]: {},
    [executeFailNoSchemaNoResultAbility.ipfsCid]: {},
    [executeFailWithSchemaAbility.ipfsCid]: {},
    [precheckFailNoSchemaErrorResultAbility.ipfsCid]: {},
    [precheckFailNoSchemaNoResultAbility.ipfsCid]: {},
    [precheckFailWithSchemaAbility.ipfsCid]: {},
    [executeFailThrowErrorAbility.ipfsCid]: {},
    [precheckFailThrowErrorAbility.ipfsCid]: {},

    // Success abilities
    [executeSuccessNoSchemaAbility.ipfsCid]: {},
    [executeSuccessWithSchemaAbility.ipfsCid]: {},
    [precheckSuccessNoSchemaAbility.ipfsCid]: {},
    [precheckSuccessWithSchemaAbility.ipfsCid]: {},

    // Abilities that return invalid results and so fail schema validation
    [executeFailInvalidSchemaAbility.ipfsCid]: {},
    [executeSuccessInvalidSchemaAbility.ipfsCid]: {},
    [precheckFailInvalidSchemaAbility.ipfsCid]: {},
    [precheckSuccessInvalidSchemaAbility.ipfsCid]: {},

    // Ability with policy that returns precheck results
    [precheckSuccessWithPolicyAbility.ipfsCid]: {
      [precheckAllowWithUserParamsMetadata.ipfsCid]: {
        y: 'test-policy-param',
      },
    },
  };

  // An array of the IPFS cid of each ability to be tested, computed from the keys of PERMISSION_DATA
  const TOOL_IPFS_IDS: string[] = Object.keys(PERMISSION_DATA);

  // Define the policies for each ability, computed from TOOL_IPFS_IDS and PERMISSION_DATA
  const TOOL_POLICIES = TOOL_IPFS_IDS.map((abilityIpfsCid) => {
    // Get the policy IPFS CIDs for this ability from PERMISSION_DATA
    return Object.keys(PERMISSION_DATA[abilityIpfsCid]);
  });

  let TEST_CONFIG: TestConfig;

  afterAll(async () => {
    console.log('Disconnecting from Lit node client...');
    await disconnectVincentAbilityClients();
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

  it('should permit all of the abilities for the Agent Wallet PKP', async () => {
    await permitAbilitiesForAgentWalletPkp(TOOL_IPFS_IDS, TEST_CONFIG);
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

  // Test cases for failure abilities
  describe('Failure abilities', () => {
    // executeFailWithSchema - Execute should fail with schema
    describe('executeFailWithSchema', () => {
      it('should fail execute with schema', async () => {
        const client = getExecuteFailWithSchemaAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getPrecheckFailWithSchemaAbilityClient();
        const result = await client.precheck(
          { x: 'test-value' }, // abilityParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(result.result?.err).toBeDefined();
        expect(result.result?.err).toContain('Intentional precheck failure with schema');
      });

      it('should succeed execute', async () => {
        const client = getPrecheckFailWithSchemaAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getExecuteFailNoSchemaNoResultAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getPrecheckFailNoSchemaNoResultAbilityClient();
        const result = await client.precheck(
          { x: 'test-value' }, // abilityParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        expect(hasError(result)).not.toBe(true);
      });

      it('should fail execute with schema', async () => {
        const client = getPrecheckFailNoSchemaNoResultAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getExecuteFailNoSchemaErrorResultAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getPrecheckFailNoSchemaErrorResultAbilityClient();
        const result = await client.precheck(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getPrecheckFailNoSchemaErrorResultAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getExecuteFailThrowErrorAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getPrecheckFailThrowErrorAbilityClient();
        const result = await client.precheck(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getPrecheckFailThrowErrorAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
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

  // Test cases for success abilities
  describe('Success abilities', () => {
    // executeSuccessWithSchema - Execute should succeed with schema
    describe('executeSuccessWithSchema', () => {
      it('should succeed execute with schema', async () => {
        const client = getExecuteSuccessWithSchemaAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getPrecheckSuccessWithSchemaAbilityClient();
        const result = await client.precheck(
          { x: 'test-value' }, // abilityParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(true);
        expect(result.result).toBeDefined();
        expect(result.result?.ok).toBe(true);
      });

      it('should succeed execute without schema', async () => {
        const client = getPrecheckSuccessWithSchemaAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getExecuteSuccessNoSchemaAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getPrecheckSuccessNoSchemaAbilityClient();
        const result = await client.precheck(
          { x: 'test-value' }, // abilityParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(true);
      });

      it('should succeed execute with schema', async () => {
        const client = getPrecheckSuccessNoSchemaAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getExecuteSuccessWithSchemaAbilityClient();
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
        const client = getPrecheckSuccessWithSchemaAbilityClient();
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
        const client = getExecuteFailInvalidSchemaAbilityClient();
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
        const client = getExecuteSuccessInvalidSchemaAbilityClient();
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
        const client = getPrecheckFailInvalidSchemaAbilityClient();
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
        const client = getPrecheckFailInvalidSchemaAbilityClient();
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
        const client = getPrecheckSuccessInvalidSchemaAbilityClient();
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
        const client = getPrecheckSuccessInvalidSchemaAbilityClient();
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
      const client = getPrecheckSuccessWithPolicyAbilityClient();
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
