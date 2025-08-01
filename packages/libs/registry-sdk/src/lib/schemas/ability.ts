import { EXAMPLE_WALLET_ADDRESS } from '../constants';
import { baseDocAttributes } from './base';
import { z } from './openApiZod';
import { fromPackageJson } from './packages';

/** ability describes all properties on an ability that are NOT controlled by the DB backend
 *
 * Any schemas that use subsets of ability properties should be composed from this using builder functions
 * instead of `AbilityDef`, which also includes MongoDB-maintained props and is the complete API response
 */
const ability = z
  .object({
    packageName: z.string().openapi({
      description: 'Ability NPM package name',
      example: '@lit-protocol/vincent-erc20-approval-ability',
    }),
    title: z.string().trim().min(2).openapi({
      description: 'Ability title - displayed to users in the dashboard/Vincent Explorer UI',
      example: 'ERC20 Approval Ability',
    }),
    authorWalletAddress: z.string().openapi({
      description:
        'Author wallet address. Derived from the authorization signature provided by the creator.',
      example: EXAMPLE_WALLET_ADDRESS,
      readOnly: true,
    }),
    description: z.string().trim().min(10).openapi({
      description: 'Ability description - displayed to users in the dashboard/Vincent Explorer UI',
      example:
        'An ability that manages ERC20 approvals for PKPs. Facilitates vincent-uniswap-swap-ability usage.',
    }),
    logo: z
      .string()
      .optional()
      .openapi({
        description: 'Base64 encoded logo image',
        example:
          'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOvwAADr8BOAVTJAAAAA5JREFUGFdj/M+ACAAAAAD//wE7AnsAAAAAAElFTkSuQmCC',
      })
      .optional(),
    activeVersion: z.string().openapi({
      description: 'Active version of the ability',
      example: '1.0.0',
    }),
    deploymentStatus: z.enum(['dev', 'test', 'prod']).optional().openapi({
      description: 'Identifies if an ability is in development, test, or production.',
      example: 'dev',
    }),
    isDeleted: z.boolean().optional().openapi({
      description: 'Whether or not this Ability is deleted',
      example: false,
    }),
  })
  .strict();

// Avoiding using z.omit() or z.pick() due to excessive TS type inference costs
function buildCreateAbilitySchema() {
  const { activeVersion, title, description, deploymentStatus, logo } = ability.shape;

  return z
    .object({
      // Required
      activeVersion,
      title,
      description,
      // Optional
      ...z
        .object({
          deploymentStatus: deploymentStatus.default('dev'),
          logo,
        })
        .partial()
        .strict().shape,
    })
    .strict();
}

export const abilityCreate = buildCreateAbilitySchema();

// Avoiding using z.omit() or z.pick() due to excessive TS type inference costs
function buildEditAbilitySchema() {
  const { activeVersion, title, description, deploymentStatus, logo } = ability.shape;

  return z
    .object({
      // Optional
      ...z.object({ activeVersion, title, description, deploymentStatus, logo }).partial().strict()
        .shape,
    })
    .strict();
}

export const abilityEdit = buildEditAbilitySchema();

/** abilityDoc describes a complete ability document, with all properties including those that are database-backend
 * specific like _id and updated/created at timestamps.
 *
 * All schemas that need to be composed as subsets of this schema
 * should be derived using builder functions from `ability` instead
 */
export const abilityDoc = z.object({ ...baseDocAttributes.shape, ...ability.shape }).strict();

/** abilityVersion describes all properties on an ability version that are NOT controlled by the DB backend */
const abilityVersion = z
  .object({
    packageName: ability.shape.packageName,
    version: z.string().openapi({
      description: 'Ability version - must be an exact semver.',
      example: '1.0.0',
    }),
    changes: z.string().trim().min(10).openapi({
      description: 'Changelog information for this version',
      example: 'Ensure commit() is run on spending policy limit for users who have it enabled.',
    }),

    // Both abilities and policies have quite a few properties read from their package.json entries
    ...fromPackageJson.shape,

    supportedPolicies: z.record(z.string(), z.string()).openapi({
      description: `Supported policies. These are detected from 'dependencies' in the ability's package.json.`,
      example: {
        '@lit-protocol/vincent-spending-limit-policy': '1.0.0',
        '@lit-protocol/vincent-rate-limit-policy': '0.0.1',
      },
      readOnly: true,
    }),
    ipfsCid: z.string().openapi({
      description: 'IPFS CID of the code that implements this ability.',
      example: 'QmdoY1VUxVvxShBQK5B6PP2jZFVw7PMTJ3qy2aiCARjMqo',
      readOnly: true,
    }),
    policiesNotInRegistry: z.array(z.string()).openapi({
      description: 'Policy versions that are not in the registry but are supported by this ability',
      example: ['@lit-protocol/vincent-spending-limit-policy@1.0.1'],
      readOnly: true,
    }),
    isDeleted: z.boolean().optional().openapi({
      description: 'Whether or not this AbilityVersion is deleted',
      example: false,
    }),
  })
  .strict();

// Avoiding using z.omit() or z.pick() due to excessive TS type inference costs
function buildCreateAbilityVersionSchema() {
  const { changes } = abilityVersion.shape;

  // Required props
  return z.object({ changes }).strict();
}

export const abilityVersionCreate = buildCreateAbilityVersionSchema();

// Avoiding using z.omit() or z.pick() due to excessive TS type inference costs
function buildEditAbilityVersionSchema() {
  const { changes } = abilityVersion.shape;

  // Required props
  return z.object({ changes }).strict();
}

export const abilityVersionEdit = buildEditAbilityVersionSchema();

/** abilityVersionDoc describes a complete ability version document, with all properties including those that are database-backend
 * specific like _id and updated/created at timestamps.
 *
 * All schemas that need to be composed as subsets of this schema
 * should be derived using builder functions from `abilityVersion` instead
 */
export const abilityVersionDoc = z
  .object({ ...baseDocAttributes.shape, ...abilityVersion.shape })
  .strict();
