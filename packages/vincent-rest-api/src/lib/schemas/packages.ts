import { z } from './openApiZod';
import { EXAMPLE_EMAIL_ADDRESS, EXAMPLE_WALLET_ADDRESS } from '../openApi/constants';

// Contributors on NPM package
export const Contributor = z.object({
  name: z.string().openapi({
    description: 'Name of the contributor',
    example: 'Contributor Name',
  }),
  email: z.string().email().openapi({
    description: 'Email of the contributor',
    example: 'contributor@example.com',
  }),
  url: z.string().url().optional().openapi({
    description: "URL of the contributor's website",
    example: 'https://contributor-site.example.com',
  }),
});

// Authors from NPM package
export const Author = z.object({
  name: z.string().openapi({
    description: 'Name of the author',
    example: 'Developer Name',
  }),
  email: z.string().email().openapi({
    description: 'Email of the author',
    example: EXAMPLE_EMAIL_ADDRESS,
  }),
  url: z.string().url().optional().openapi({
    description: "URL of the author's website",
    example: 'https://example.com',
  }),
});

// Request body for changing a tool/policy owner
export const ChangeOwner = z.object({
  authorWalletAddress: z.string().openapi({
    description: 'New owner address',
    example: EXAMPLE_WALLET_ADDRESS,
  }),
});

// Generic schema to represent fetching a tool/policy version(s)
// Not actually used in the API since the packageName is not used in the request body
// but it's useful for the OpenAPI spec

export const GetToolPolicy = z.object({
  packageName: z.string().openapi({
    description: 'Policy package name',
    example: '@vincent/foo-bar-policy',
  }),
});
