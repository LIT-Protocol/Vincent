import { baseDocAttributes } from './base';
import { EXAMPLE_WALLET_ADDRESS } from '../constants';
import { z } from './openApiZod';
import { fromPackageJson } from './packages';

/** tool describes all properties on a tool that are NOT controlled by the DB backend
 *
 * Any schemas that use subsets of tool properties should be composed from this using builder functions
 * instead of `ToolDef`, which also includes MongoDB-maintained props and is the complete API response
 */
const tool = z
  .object({
    packageName: z.string().openapi({
      description: 'Tool NPM package name',
      example: '@lit-protocol/vincent-erc20-approval-tool',
    }),
    title: z.string().optional().openapi({
      description: 'Tool title - displayed to users in the dashboard/Vincent Explorer UI',
      example: 'ERC20 Approval Tool',
    }),
    authorWalletAddress: z.string().openapi({
      description:
        'Author wallet address. Derived from the authorization signature provided by the creator.',
      example: EXAMPLE_WALLET_ADDRESS,
      readOnly: true,
    }),
    description: z.string().openapi({
      description: 'Tool description - displayed to users in the dashboard/Vincent Explorer UI',
      example:
        'A tool that manages ERC20 approvals for PKPs. Facilitates vincent-uniswap-swap-tool usage.',
    }),
    activeVersion: z.string().openapi({
      description: 'Active version of the tool',
      example: '1.0.0',
    }),
  })
  .strict();

// Avoiding using z.omit() or z.pick() due to excessive TS type inference costs
function buildCreateToolSchema() {
  const { packageName, activeVersion, title, description } = tool.shape;

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

export const toolCreate = buildCreateToolSchema();

// Avoiding using z.omit() or z.pick() due to excessive TS type inference costs
function buildEditToolSchema() {
  const { activeVersion, title, description, packageName } = tool.shape;

  return z
    .object({
      // Optional
      ...z.object({ activeVersion, title, description }).partial().strict().shape,

      // Required
      packageName,
    })
    .strict();
}

export const toolEdit = buildEditToolSchema();

/** toolRead describes a complete tool document, with all properties including those that are database-backend
 * specific like _id and updated/created at timestamps.
 *
 * All schemas that need to be composed as subsets of this schema
 * should be derived using builder functions from `tool` instead
 */
export const toolRead = z.object({ ...baseDocAttributes.shape, ...tool.shape }).strict();

/** toolVersion describes all properties on a tool version that are NOT controlled by the DB backend */
const toolVersion = z
  .object({
    packageName: tool.shape.packageName,
    version: z.string().openapi({
      description: 'Tool version - must be an exact semver.',
      example: '1.0.0',
    }),
    changes: z.string().openapi({
      description: 'Changelog information for this version',
      example: 'Ensure commit() is run on spending policy limit for users who have it enabled.',
    }),

    // Both tools and policies have quite a few properties read from their package.json entries
    ...fromPackageJson.shape,

    supportedPolicies: z.array(z.string()).openapi({
      description: `Supported policies. These are detected from 'dependencies' in the tool's package.json.`,
      example: [
        '@lit-protocol/vincent-spending-limit-policy@1.0.0',
        '@lit-protocol/vincent-rate-limit-policy@0.0.1',
      ],
      readOnly: true,
    }),
    ipfsCid: z.string().openapi({
      description: 'IPFS CID of the code that implements this tool.',
      example: 'QmdoY1VUxVvxShBQK5B6PP2jZFVw7PMTJ3qy2aiCARjMqo',
      readOnly: true,
    }),
  })
  .strict();

// Avoiding using z.omit() or z.pick() due to excessive TS type inference costs
function buildCreateToolVersionSchema() {
  const { changes, packageName, version } = toolVersion.shape;

  // Required props
  return z.object({ changes, packageName, version }).strict();
}

export const toolVersionCreate = buildCreateToolVersionSchema();

// Avoiding using z.omit() or z.pick() due to excessive TS type inference costs
function buildEditToolVersionSchema() {
  const { changes, packageName, version } = toolVersion.shape;

  // Required props
  return z.object({ changes, packageName, version }).strict();
}

export const toolVersionEdit = buildEditToolVersionSchema();

/** toolVersionRead describes a complete tool version document, with all properties including those that are database-backend
 * specific like _id and updated/created at timestamps.
 *
 * All schemas that need to be composed as subsets of this schema
 * should be derived using builder functions from `toolVersion` instead
 */
export const toolVersionRead = z
  .object({ ...baseDocAttributes.shape, ...toolVersion.shape })
  .strict();
