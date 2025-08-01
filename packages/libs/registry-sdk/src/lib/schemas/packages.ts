import { EXAMPLE_EMAIL_ADDRESS, EXAMPLE_WALLET_ADDRESS } from '../constants';
import { z } from './openApiZod';

// Contributors on NPM package
export const contributor = z.object({
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
export const author = z.object({
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

export const fromPackageJson = z.object({
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
  author: author.openapi({
    description: 'Author information',
  }),
  contributors: z.array(contributor).openapi({
    description: 'Contributors information',
  }),
  homepage: z.string().url().optional().openapi({
    description: 'Policy homepage',
    example: 'https://example-vincent-homepage.com',
  }),
});

// Request body for changing an ability/policy owner
export const changeOwner = z.object({
  authorWalletAddress: z.string().openapi({
    description: 'New owner address',
    example: EXAMPLE_WALLET_ADDRESS,
  }),
});
