import { BaseDocAttributes } from './base';
import { EXAMPLE_WALLET_ADDRESS } from './constants';
import { z } from './openApiZod';
import { Author, Contributor } from './packages';

// Request body for creating a new tool
export const CreateTool = z.object({
  packageName: z.string().openapi({
    description: 'Tool package name',
    example: '@vincent/foo-bar',
  }),
  title: z.string().openapi({
    description: 'Tool title',
    example: 'The Greatest Foo Bar Tool',
  }),
  description: z.string().openapi({
    description: 'Tool description',
    example: 'When we foo, our complex tool will also bar.',
  }),
  version: z.string().openapi({
    description: 'An initial version of the tool; must be an exact semver',
    example: '1.0.0',
  }),
});

// Request body for editing a tool
export const EditTool = z.object({
  title: z.string().openapi({
    description: 'Tool title',
    example: 'The Greatest Foo Bar Tool',
  }),
  description: z.string().openapi({
    description: 'Tool description',
    example: 'When we foo, our complex tool will also bar.',
  }),
  activeVersion: z.string().openapi({
    description: 'Active version of the tool',
    example: '1.0.0',
  }),
});

// The response body when fetching a tool
export const ToolDef = BaseDocAttributes.extend({
  packageName: z.string().openapi({
    description: 'Tool package name',
    example: '@vincent/foo-bar',
  }),
  title: z.string().optional().openapi({
    description: 'Tool title',
    example: 'The Greatest Foo Bar Tool',
  }),
  authorWalletAddress: z.string().openapi({
    description: 'Author wallet address',
    example: EXAMPLE_WALLET_ADDRESS,
  }),
  description: z.string().openapi({
    description: 'Tool description',
    example: 'When we foo, our complex tool will also bar.',
  }),
  activeVersion: z.string().openapi({
    description: 'Active version of the tool',
    example: '1.0.0',
  }),
});
export const CreateToolVersion = z.object({
  packageName: z.string().openapi({
    description: 'Tool package name',
    example: '@vincent/foo-bar',
  }),
  version: z.string().openapi({
    description: 'Tool version',
    example: '1.0.0',
  }),
});
// The response body when fetching a tool version
export const ToolVersionDef = z.object({
  packageName: z.string().openapi({
    description: 'Tool package name',
    example: '@vincent/foo-bar',
  }),
  version: z.string().openapi({
    description: 'Tool version',
    example: '1.0.0',
  }),
  changes: z.string().openapi({
    description: 'Changelog information for this version',
    example: 'Initial release',
  }),
  repository: z.array(z.string()).openapi({
    description: 'Repository URLs',
    example: ['https://github.com/org/repo'],
  }),
  keywords: z.array(z.string()).openapi({
    description: 'Keywords for the tool',
    example: ['defi', 'memecoin'],
  }),
  dependencies: z.array(z.string()).openapi({
    description: 'Dependencies of the tool',
    example: ['@vincent/sdk'],
  }),
  author: Author.openapi({
    description: 'Author information',
  }),
  contributors: z.array(Contributor).openapi({
    description: 'Contributors information',
  }),
  homepage: z.string().url().optional().openapi({
    description: 'Tool homepage',
    example: 'https://example-vincent-homepage.com',
  }),
  status: z.enum(['invalid', 'validating', 'valid', 'error']).openapi({
    description: 'Tool status',
    example: 'valid',
  }),
  supportedPolicies: z.array(z.string()).openapi({
    description: 'Supported policies',
    example: ['@vincent/foo-bar-policy-1@1.0.0', '@vincent/foo-bar-policy-2@1.1.0'],
  }),
  ipfsCid: z.string().openapi({
    description: 'IPFS CID',
    example: 'QmdoY1VUxVvxShBQK5B6PP2jZFVw7PMTJ3qy2aiCARjMqo',
  }),
});

// NEW SCHEMAS

export const GetTool = z.object({
  packageName: z.string().openapi({
    description: 'Tool package name',
    example: '@vincent/foo-bar',
  }),
});

export const GetToolVersions = z.object({
  packageName: z.string().openapi({
    description: 'Tool package name',
    example: '@vincent/foo-bar',
  }),
});

export const ChangeToolOwner = z.object({
  packageName: z.string().openapi({
    description: 'Tool package name',
    example: '@vincent/foo-bar',
  }),
  authorWalletAddress: z.string().openapi({
    description: 'New owner address',
    example: EXAMPLE_WALLET_ADDRESS,
  }),
});

export const GetToolVersion = z.object({
  packageName: z.string().openapi({
    description: 'Tool package name',
    example: '@vincent/foo-bar',
  }),
  version: z.string().openapi({
    description: 'Tool version',
    example: '1.0.0',
  }),
});

export const EditToolVersion = z.object({
  packageName: z.string().min(1, 'Package name is required').openapi({
    description: 'Tool package name',
    example: '@vincent/foo-bar',
  }),
  version: z.string().min(1, 'Version is required').openapi({
    description: 'Tool version',
    example: '1.0.0',
  }),
  changes: z.string().min(1, 'Changes description is required').openapi({
    description: 'Changes description',
    example: 'Initial release',
  }),
});
