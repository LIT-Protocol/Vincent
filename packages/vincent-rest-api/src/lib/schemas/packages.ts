import { z } from './openApiZod';
import { EXAMPLE_EMAIL_ADDRESS } from '../openApi/constants';

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
