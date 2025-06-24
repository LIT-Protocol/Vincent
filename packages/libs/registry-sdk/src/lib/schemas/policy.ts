import { z } from './openApiZod';
import { fromPackageJson } from './packages';
import { baseDocAttributes } from './base';
import { EXAMPLE_WALLET_ADDRESS } from '../constants';

/** policy describes all properties on a policy that are NOT controlled by the DB backend
 *
 * Any schemas that use subsets of policy properties should be composed from this using builder functions
 * instead of `PolicyDef`, which also includes MongoDB-maintained props and is the complete API response
 */
export const policy = z
  .object({
    packageName: z.string().openapi({
      description: 'Policy NPM package name',
      example: '@lit-protocol/vincent-policy-spending-limit',
    }),
    authorWalletAddress: z.string().openapi({
      description:
        'Author wallet address. Derived from the authorization signature provided by the creator.',
      example: EXAMPLE_WALLET_ADDRESS,
      readOnly: true,
    }),
    description: z.string().openapi({
      description: 'Policy description - displayed to users in the dashboard/Vincent Explorer UI',
      example: 'This policy is a foo bar policy',
    }),
    activeVersion: z.string().openapi({
      description: 'Active version of the policy; must be an exact semver',
      example: '1.0.0',
    }),
    title: z.string().openapi({
      description: 'Policy title for displaying to users in the dashboard/Vincent Explorer UI',
      example: 'Vincent Spending Limit Policy',
    }),
  })
  .strict();

// Avoiding using z.omit() or z.pick() due to excessive TS type inference costs
function buildCreatePolicySchema() {
  const { packageName, activeVersion, title, description } = policy.shape;

  return z
    .object({
      // Required
      packageName,
      activeVersion,
      title,
      description,
    })
    .strict();
}

export const createPolicy = buildCreatePolicySchema();

// Avoiding using z.omit() or z.pick() due to excessive TS type inference costs
function buildEditPolicySchema() {
  const { activeVersion, title, description, packageName } = policy.shape;

  return z
    .object({
      // Optional
      ...z.object({ activeVersion, title, description }).partial().strict().shape,

      // Required
      packageName,
    })
    .strict();
}

export const editPolicy = buildEditPolicySchema();

/** PolicyDef describes a complete policy document, with all properties including those that are database-backend
 * specific like _id and updated/created at timestamps.
 *
 * Do not duplicate these definitions into other schemas like `edit` or `create`.
 *
 * All schemas that need to be composed as subsets of this schema
 * should be derived using builder functions from `policy` instead
 */
export const policyDef = z.object({ ...baseDocAttributes.shape, ...policy.shape }).strict();

/** policyVersion describes all properties on a policy version that are NOT controlled by the DB backend */
export const policyVersion = z
  .object({
    packageName: policy.shape.packageName,
    version: z.string().openapi({
      description: 'Policy version - must be an exact semver',
      example: '1.0.0',
    }),
    changes: z.string().openapi({
      description: 'Changelog information for this version',
      example: 'Resolved issue with checking for spending limits on the wrong chain.',
    }),

    // Both tools and policies have quite a few properties read from their package.json entries
    ...fromPackageJson.shape,

    ipfsCid: z.string().openapi({
      description: 'IPFS CID',
      example: 'QmdoY1VUxVvxShBQK5B6PP2jZFVw7PMTJ3qy2aiCARjMqo',
    }),
    parameters: z
      .object({
        uiSchema: z.string().openapi({
          description: 'UI Schema for parameter display',
          example: '{"type":"object","properties":{}}',
        }),
        jsonSchema: z.string().openapi({
          description: 'JSON Schema for parameter validation',
          example: '{"type":"object","required":[],"properties":{}}',
        }),
      })
      .optional() // Until we get support for these shipped :)
      .openapi({
        description: 'Schema parameters',
      }),
  })
  .strict();

// Avoiding using z.omit() or z.pick() due to excessive TS type inference costs
function buildCreatePolicyVersionSchema() {
  const { changes, packageName, version } = policyVersion.shape;

  // Required props
  return z.object({ changes, packageName, version }).strict();
}

export const createPolicyVersion = buildCreatePolicyVersionSchema();

/** PolicyVersionDef describes a complete policy version document, with all properties including those that are database-backend
 * specific like _id and updated/created at timestamps.
 *
 * Do not duplicate these definitions into other schemas like `edit` or `create`.
 *
 * All schemas that need to be composed as subsets of this schema
 * should be derived using builder functions from `policyVersion` instead
 */
export const policyVersionDef = z
  .object({ ...baseDocAttributes.shape, ...policyVersion.shape })
  .strict();
