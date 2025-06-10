import { z } from 'zod';
import { Author, Contributor } from './packages';
import { BaseDocAttributes } from './base';

export const PolicyDef = BaseDocAttributes.extend({
  packageName: z.string().openapi({
    description: 'Policy package name',
    example: '@vincent/foo-bar-policy',
  }),
  authorWalletAddress: z.string().openapi({
    description: 'Author wallet address',
    example: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
  }),
  description: z.string().openapi({
    description: 'Policy description',
    example: 'This policy is a foo bar policy',
  }),
  activeVersion: z.string().openapi({
    description: 'Active version of the policy',
    example: '1.0.0',
  }),
});

export const CreatePolicy = z.object({
  packageName: z.string().openapi({
    description: 'Policy package name',
    example: '@vincent/foo-bar-policy',
  }),
  policyTitle: z.string().openapi({
    description: 'Policy title',
    example: 'The Greatest Foo Bar Policy',
  }),
  description: z.string().openapi({
    description: 'Policy description',
    example: 'This policy is a foo bar policy',
  }),
});

export const PolicyVersionDef = BaseDocAttributes.extend({
  packageName: z.string().openapi({
    description: 'Policy package name',
    example: '@vincent/foo-bar-policy',
  }),
  version: z.string().openapi({
    description: 'Policy version',
    example: '1.0.0',
  }),
  changes: z.string().openapi({
    description: 'Changelog information for this version',
    example: 'Initial release',
  }),
  repository: z.array(z.string()).openapi({
    description: 'Repository URLs',
  }),
  description: z.string().openapi({
    description: 'Policy description',
    example: 'This policy is a foo bar policy',
  }),
  keywords: z.array(z.string()).openapi({
    description: 'Keywords for the policy',
    example: ['defi', 'memecoin'],
  }),
  dependencies: z.array(z.string()).openapi({
    description: 'Dependencies of the policy',
  }),
  author: Author.openapi({
    description: 'Author information',
  }),
  contributors: z.array(Contributor).openapi({
    description: 'Contributors information',
  }),
  homepage: z.string().url().optional().openapi({
    description: 'Policy homepage',
    example: 'https://example-vincent-homepage.com',
  }),
  status: z.enum(['invalid', 'validating', 'valid', 'error']).openapi({
    description: 'Policy status',
    example: 'valid',
  }),
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
    .openapi({
      description: 'Schema parameters',
    }),
});

export const EditPolicy = z.object({
  policyTitle: z.string().openapi({
    description: 'Policy title',
    example: 'The Greatest Foo Bar Policy',
  }),
  description: z.string().openapi({
    description: 'Policy description',
    example: 'This policy is a foo bar policy',
  }),
  activeVersion: z.string().openapi({
    description: 'Active version of the policy',
    example: '1.0.0',
  }),
});

// Request body for creating a new policy version
export const CreatePolicyVersion = z.object({
  packageName: z.string().openapi({
    description: 'Policy package name',
    example: '@vincent/foo-bar-policy',
  }),
  version: z.string().openapi({
    description: 'Policy version',
    example: '1.0.0',
  }),
  changes: z.string().openapi({
    description: 'Changelog information for this version',
    example: 'Extra foo on the bar!',
  }),
});
