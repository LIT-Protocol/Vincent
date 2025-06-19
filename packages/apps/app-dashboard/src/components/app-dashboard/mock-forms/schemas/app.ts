import { z } from './openApiZod';
import { BaseDocAttributes } from './base';
import { EXAMPLE_WALLET_ADDRESS, EXAMPLE_EMAIL_ADDRESS } from './constants';

// Request body for creating a new application
export const CreateApp = z.object({
  appId: z.number().optional().openapi({
    description: 'Application ID (optional - will be generated if not provided)',
    example: 12345,
  }),
  name: z.string().openapi({
    description: 'The name of the application',
    example: 'Memecoin DCA App',
  }),
  description: z.string().openapi({
    description: 'Description of the application',
    example: 'This is a memecoin DCA App',
  }),
  contactEmail: z.string().email().openapi({
    description: 'Contact email for the application manager',
    example: EXAMPLE_EMAIL_ADDRESS,
  }),
  appUserUrl: z.string().url().openapi({
    description: 'URL of the application for users',
    example: 'https://myapplication.example.com/',
  }),
  logo: z.string().openapi({
    description: 'Base64 encoded logo image',
    example:
      'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOvwAADr8BOAVTJAAAAA5JREFUGFdj/M+ACAAAAAD//wE7AnsAAAAAAElFTkSuQmCC',
  }),
  redirectUris: z.array(z.string().url()).openapi({
    description:
      'Redirect URIs users can be sent to after signing up for your application (with their JWT token)',
    example: ['https://google.com', 'https://litprotocol.com'],
  }),
  tools: z.array(z.string()).openapi({
    description: 'List of tool identities to include in the initial version',
    example: ['@vincent/foo-bar@1.0.0'],
  }),
  deploymentStatus: z.enum(['dev', 'test', 'prod']).openapi({
    description: 'Deployment status of the application; dev, test, or prod',
    example: 'dev',
  }),
  managerAddress: z.string().openapi({
    description: 'Manager wallet address',
    example: EXAMPLE_WALLET_ADDRESS,
  }),
});

// Extends the request body of an application with server-provided properties
export const AppDef = BaseDocAttributes.merge(CreateApp).extend({
  appId: z.number().openapi({
    description: 'Application ID',
    example: 12345,
    readOnly: true,
  }),
  activeVersion: z.number().openapi({
    description: 'Active version of the application',
    example: 1,
  }),
});

// Request body for creating a new application version
export const CreateAppVersion = z.object({
  tools: z.array(z.string()).openapi({
    description: 'List of tool identities to include in this version',
    example: ['@vincent/foo-bar@1.0.0'],
  }),
  changes: z.string().openapi({
    description: 'Changelog information for this version',
    example: 'I am a changelog trapped in a computer!',
  }),
});

// Application version response
export const AppVersionDef = BaseDocAttributes.extend({
  appId: z.number().openapi({
    description: 'Application ID',
    example: 12312345,
    readOnly: true,
  }),
  version: z.number().openapi({
    description: 'Version number',
    example: 1,
  }),
  enabled: z.boolean().openapi({
    description: 'Whether this version is enabled',
    example: true,
  }),
  changes: z.string().openapi({
    description: 'Changelog information for this version',
    example: 'I am a changelog trapped in a computer!',
  }),
});

export const AppToolDef = BaseDocAttributes.extend({
  appId: z.number().openapi({
    description: 'Application ID',
    example: 5,
    readOnly: true,
  }),
  appVersion: z.number().openapi({
    description: 'Application version',
    example: 2,
  }),
  toolPackageName: z.string().openapi({
    description: 'Tool package name',
    example: '@vincent/foo-bar',
  }),
  toolVersion: z.string().openapi({
    description: 'Tool version',
    example: '1.0.0',
  }),
  hiddenSupportedPolicies: z.array(z.string()).openapi({
    description:
      'Policies that are supported by this tool but are hidden from users of this app specifically',
    example: ['@vincent/foo-bar-policy-1', '@vincent/foo-bar-policy-2'],
  }),
});

export const AppVersionWithTools = z
  .object({
    version: AppVersionDef,
    tools: z.array(AppToolDef),
  })
  .openapi({
    description: 'Application version with its tools',
  });

export const EditApp = z.object({
  name: z.string().openapi({
    description: 'The name of the application',
    example: 'Memecoin DCA App',
  }),
  description: z.string().openapi({
    description: 'Description of the application',
    example: 'This is a memecoin DCA App',
  }),
  contactEmail: z.string().email().openapi({
    description: 'Contact email for the application manager',
    example: EXAMPLE_EMAIL_ADDRESS,
  }),
  appUserUrl: z.string().url().openapi({
    description: 'URL of the application for users',
    example: 'https://myapplication.example.com/',
  }),
  logo: z.string().openapi({
    description: 'Base64 encoded logo image',
    example:
      'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOvwAADr8BOAVTJAAAAA5JREFUGFdj/M+ACAAAAAD//wE7AnsAAAAAAElFTkSuQmCC',
  }),
  redirectUris: z.array(z.string().url()).openapi({
    description:
      'Redirect URIs users can be sent to after signing up for your application (with their JWT token)',
    example: ['https://google.com', 'https://litprotocol.com'],
  }),
  deploymentStatus: z.enum(['dev', 'test', 'prod']).openapi({
    description: 'Deployment status of the application; dev, test, or prod',
    example: 'dev',
  }),
  activeVersion: z.number().openapi({
    description: 'Active version of the application',
    example: 1,
  }),
});

export const DeleteApp = (appId: string) =>
  z.object({
    confirmation: z
      .string()
      .openapi({
        description: `You must type exactly: "I want to delete app ${appId}"`,
        example: `I want to delete app ${appId}`,
      })
      .refine((val) => val === `I want to delete app ${appId}`, {
        message: `You must type exactly: "I want to delete app ${appId}"`,
        path: ['confirmation'],
      }),
  });
