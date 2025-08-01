import { formatEther } from 'viem';

import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import { ethers } from 'ethers';
import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';

// Import all bundled Vincent abilities from the generated directory
// Policy failure abilities - evaluate
import { bundledVincentAbility as evaluateDenyThrowErrorAbility } from '../src/generated/abilities/withPolicyFailures/evaluateDenyThrowError/vincent-bundled-ability';
import { bundledVincentAbility as evaluateDenyWithSchemaAbility } from '../src/generated/abilities/withPolicyFailures/evaluateDenyWithSchema/vincent-bundled-ability';
import { bundledVincentAbility as evaluateDenyNoSchemaErrorResultAbility } from '../src/generated/abilities/withPolicyFailures/evaluateDenyNoSchemaErrorResult/vincent-bundled-ability';
import { bundledVincentAbility as evaluateDenyNoSchemaNoResultAbility } from '../src/generated/abilities/withPolicyFailures/evaluateDenyNoSchemaNoResult/vincent-bundled-ability';
import { bundledVincentAbility as executeFailBecauseEvaluateDenyWithAbilityFailureSchema } from '../src/generated/abilities/withPolicyFailures/evaluateDenyWithAbilityFailureSchema/vincent-bundled-ability';
import { bundledVincentAbility as evaluateDenyWithSchemaValidationError } from '../src/generated/abilities/withPolicyFailures/evaluateDenyWithSchemaValidationError/vincent-bundled-ability';

// Policy failure abilities - precheck
import { bundledVincentAbility as precheckDenyThrowErrorAbility } from '../src/generated/abilities/withPolicyFailures/precheckDenyThrowError/vincent-bundled-ability';
import { bundledVincentAbility as precheckDenyWithSchemaAbility } from '../src/generated/abilities/withPolicyFailures/precheckDenyWithSchema/vincent-bundled-ability';
import { bundledVincentAbility as precheckDenyNoSchemaErrorResultAbility } from '../src/generated/abilities/withPolicyFailures/precheckDenyNoSchemaErrorResult/vincent-bundled-ability';
import { bundledVincentAbility as precheckDenyNoSchemaNoResultAbility } from '../src/generated/abilities/withPolicyFailures/precheckDenyNoSchemaNoResult/vincent-bundled-ability';

// Import policy metadata
// Evaluate policy metadata
import evaluateDenyThrowErrorMetadata from '../src/generated/policies/deny/noSchema/evaluateDenyThrowError/vincent-policy-metadata.json';
import evaluateDenyWithSchemaMetadata from '../src/generated/policies/deny/withSchema/evaluateDenyWithSchema/vincent-policy-metadata.json';
import evaluateDenyWithSchemaValidationErrorMetadata from '../src/generated/policies/deny/withSchema/evaluateDenyWithSchemaValidationError/vincent-policy-metadata.json';
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
  permitAbilitiesForAgentWalletPkp,
  registerNewApp,
  removeAppDelegateeIfNeeded,
} from './helpers/setup-fixtures';
import { checkShouldMintCapacityCredit } from './helpers/check-mint-capcity-credit';
import { privateKeyToAccount } from 'viem/accounts';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

// Function moved to setup-fixtures.ts

// Create a delegatee wallet for ability execution; used as `ethersSigner` for `getVincentAbilityClient()` for each ability to be tested.
const getDelegateeWallet = () => {
  return new ethers.Wallet(
    TEST_APP_DELEGATEE_PRIVATE_KEY as string,
    new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
  );
};

// Helper functions to get a VincentAbilityClient for each ability
// Evaluate policy failure abilities
const getEvaluateDenyThrowErrorAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: evaluateDenyThrowErrorAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getEvaluateDenyWithSchemaAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: evaluateDenyWithSchemaAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getEvaluateDenyNoSchemaErrorResultAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: evaluateDenyNoSchemaErrorResultAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getEvaluateDenyNoSchemaNoResultAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: evaluateDenyNoSchemaNoResultAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getExecuteFailBecauseEvaluateDenyWithAbilityFailureSchemaAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: executeFailBecauseEvaluateDenyWithAbilityFailureSchema,
    ethersSigner: getDelegateeWallet(),
  });
};

const getEvaluateDenyWithSchemaValidationErrorAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: evaluateDenyWithSchemaValidationError,
    ethersSigner: getDelegateeWallet(),
  });
};

// Precheck policy failure abilities
const getPrecheckDenyThrowErrorAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: precheckDenyThrowErrorAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckDenyWithSchemaAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: precheckDenyWithSchemaAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckDenyNoSchemaErrorResultAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: precheckDenyNoSchemaErrorResultAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getPrecheckDenyNoSchemaNoResultAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: precheckDenyNoSchemaNoResultAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

describe('VincentAbilityClient policy failure tests', () => {
  // Define permission data for all abilities and policies
  const PERMISSION_DATA: PermissionData = {
    // Evaluate policy failure abilities
    [evaluateDenyThrowErrorAbility.ipfsCid]: {
      [evaluateDenyThrowErrorMetadata.ipfsCid]: {
        y: 'test-value',
      },
    },
    [evaluateDenyWithSchemaAbility.ipfsCid]: {
      [evaluateDenyWithSchemaMetadata.ipfsCid]: {
        y: 'test-value',
      },
    },
    [evaluateDenyNoSchemaErrorResultAbility.ipfsCid]: {
      [evaluateDenyNoSchemaErrorResultMetadata.ipfsCid]: {
        y: 'test-value',
      },
    },
    [evaluateDenyNoSchemaNoResultAbility.ipfsCid]: {
      [evaluateDenyNoSchemaNoResultMetadata.ipfsCid]: {
        y: 'test-value',
      },
    },

    [executeFailBecauseEvaluateDenyWithAbilityFailureSchema.ipfsCid]: {
      [evaluateDenyWithSchemaMetadata.ipfsCid]: {
        y: 'test-value',
      },
    },

    [evaluateDenyWithSchemaValidationError.ipfsCid]: {
      [evaluateDenyWithSchemaValidationErrorMetadata.ipfsCid]: {
        y: 'test-value',
      },
    },

    // Precheck policy failure abilities
    [precheckDenyThrowErrorAbility.ipfsCid]: {
      [precheckDenyThrowErrorMetadata.ipfsCid]: {
        y: 'test-value',
      },
    },
    [precheckDenyWithSchemaAbility.ipfsCid]: {
      [precheckDenyWithSchemaMetadata.ipfsCid]: {
        y: 'test-value',
      },
    },
    [precheckDenyNoSchemaErrorResultAbility.ipfsCid]: {
      [precheckDenyNoSchemaErrorResultMetadata.ipfsCid]: {
        y: 'test-value',
      },
    },
    [precheckDenyNoSchemaNoResultAbility.ipfsCid]: {
      [precheckDenyNoSchemaNoResultMetadata.ipfsCid]: {
        y: 'test-value',
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

  // Test cases for policy failure abilities
  describe('Policy failure abilities - Evaluate', () => {
    // evaluateDenyThrowError - Policy throws an error during evaluation
    describe('evaluateDenyThrowError', () => {
      it('should fail due to policy throwing an error during evaluation', async () => {
        const client = getEvaluateDenyThrowErrorAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getEvaluateDenyWithSchemaAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getEvaluateDenyNoSchemaErrorResultAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getEvaluateDenyNoSchemaNoResultAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
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

    describe('executeFailWithSchema', () => {
      it('should fail execute with schema when policy denies', async () => {
        const client = getExecuteFailBecauseEvaluateDenyWithAbilityFailureSchemaAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.result).toBeUndefined(); // eval denied, so result will be undefined
          expect(result.context?.policiesContext.deniedPolicy?.packageName).toBe(
            '@lit-protocol/evaluateDenyWithSchema',
          );

          expect(result.context?.policiesContext.deniedPolicy?.result).toEqual({
            reason: 'Intentional evaluate denial with schema',
          });
        }
      });
    });

    describe('executeFailWithSchemaValidationError', () => {
      it('should fail execute with schema when policy denies', async () => {
        const client = getEvaluateDenyWithSchemaValidationErrorAbilityClient();
        const result = await client.execute(
          { x: 'test-value' }, // abilityParams with x: string shape
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.result).toBeUndefined(); // eval denied, so result will be undefined
          expect(result.context?.policiesContext.deniedPolicy?.packageName).toBe(
            '@lit-protocol/evaluateDenyWithSchemaValidationError',
          );
          expect(result.context?.policiesContext.deniedPolicy?.result).toBeUndefined();
          expect(result.context?.policiesContext.deniedPolicy?.runtimeError).toBe(
            'Invalid evaluate result.',
          );
          expect(result.context?.policiesContext.deniedPolicy?.schemaValidationError).toBeTruthy();
          console.log(result.context?.policiesContext.deniedPolicy?.schemaValidationError);
        }
      });
    });
  });

  // Test cases for policy failure abilities - Precheck
  describe('Policy failure abilities - Precheck', () => {
    // precheckDenyThrowError - Policy throws an error during precheck
    describe('precheckDenyThrowError', () => {
      it('should fail due to policy throwing an error during precheck', async () => {
        const client = getPrecheckDenyThrowErrorAbilityClient();
        const result = await client.precheck(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getPrecheckDenyWithSchemaAbilityClient();
        const result = await client.precheck(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getPrecheckDenyNoSchemaErrorResultAbilityClient();
        const result = await client.precheck(
          { x: 'test-value' }, // abilityParams with x: string shape
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
        const client = getPrecheckDenyNoSchemaNoResultAbilityClient();
        const result = await client.precheck(
          { x: 'test-value' }, // abilityParams with x: string shape
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
