import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// Request body for creating a new application
// Active version is optional, since we'll set it to 1, but we'll need to change it if the user wants to update the active version
export const CreateAppDef = z.object({
  name: z.string().openapi({
    description: 'The name of the application',
    example: 'Memecoin DCA App',
  }),
  description: z.string().openapi({
    description: 'Description of the application',
    example: 'This is a memecoin DCA App',
  }),
  contactEmail: z.string().email().openapi({
    description: 'Contact email for the application',
    example: 'andrew@litprotocol.com',
  }),
  appUserUrl: z.string().url().openapi({
    description: 'URL of the application for users',
    example: 'https://uniswap.com',
  }),
  logo: z.string().openapi({
    description: 'Base64 encoded logo image',
    example: 'Imagine this is a base64 string',
  }),
  redirectUris: z.array(z.string().url()).openapi({
    description: 'Redirect URIs for the application',
    example: ['https://google.com', 'https://litprotocol.com'],
  }),
  deploymentStatus: z.enum(['dev', 'test', 'prod']).openapi({
    description: 'Deployment status of the application',
    example: 'dev',
  }),
  managerAddress: z.string().openapi({
    description: 'Manager wallet address',
    example: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
  }),
  activeVersion: z.number().optional().openapi({
    description: 'Active version of the application',
    example: 2,
  }),
});

// Extends the request body of an application with the identity, appId, activeVersion, and lastUpdated fields
// These fields are set by the server
export const AppDef = CreateAppDef.extend({
  identity: z.string().openapi({
    description: 'Unique composite identifier in the format AppDef|<appId>',
    example: 'AppDef|5',
    readOnly: true,
  }),
  appId: z.number().openapi({
    description: 'Application ID',
    example: 5,
    readOnly: true,
  }),
  activeVersion: z.number().openapi({
    description: 'Active version of the application',
    example: 2,
  }),
  lastUpdated: z.string().datetime().openapi({
    description: 'Last updated timestamp',
    readOnly: true,
  }),
});

// Request body for creating a new application version
// Tools is an array of tool identities to include in this version
// Changes is the changelog information for this version
export const CreateAppVersionDef = z.object({
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
export const AppVersionDef = z.object({
  appId: z.number().openapi({
    description: 'Application ID',
    example: 5,
    readOnly: true,
  }),
  version: z.number().openapi({
    description: 'Version number',
    example: 2,
  }),
  identity: z.string().openapi({
    description: 'Unique composite identifier in the format AppVersionDef|<appId>@<version>',
    example: 'AppVersionDef|5@2',
    readOnly: true,
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

// Used for the response body when fetching an application version with its tools
export const AppToolDef = z.object({
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
  toolIdentity: z.string().openapi({
    description: 'Tool identity',
    example: '@vincent/foo-bar@1.0.0',
  }),
  identity: z.string().openapi({
    description: 'Unique composite identifier',
    example: 'AppToolDef|AppDef|5/@vincent/foo-bar@1.0.0',
  }),
});

// The response body when fetching an application version with its tools
export const AppVersionWithToolsDef = z
  .object({
    version: AppVersionDef,
    tools: z.array(AppToolDef),
  })
  .openapi({
    description: 'Application version with its tools',
  });

// Request body for creating a new tool
export const CreateToolDef = z.object({
  packageName: z.string().openapi({
    description: 'Tool package name',
    example: '@vincent/foo-bar',
  }),
  toolTitle: z.string().openapi({
    description: 'Tool title',
    example: 'The Greatest Foo Bar Tool',
  }),
  description: z.string().openapi({
    description: 'Tool description',
    example: 'When we foo, our complex tool will also bar.',
  }),
});

// Request body for editing a tool
export const EditToolDef = z.object({
  toolTitle: z.string().openapi({
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
export const ToolDef = z.object({
  packageName: z.string().openapi({
    description: 'Tool package name',
    example: '@vincent/foo-bar',
  }),
  toolTitle: z.string().optional().openapi({
    description: 'Tool title',
    example: 'The Greatest Foo Bar Tool',
  }),
  identity: z.string().openapi({
    description: 'Unique composite identifier',
    example: 'ToolDef|@vincent/foo-bar',
  }),
  authorWalletAddress: z.string().openapi({
    description: 'Author wallet address',
    example: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
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

// Request body for creating a new tool version
export const CreateToolVersionDef = z.object({
  changes: z.string().openapi({
    description: 'Changelog information for this version',
    example: 'Extra foo on the bar!',
  }),
});

// Contributor schema
const Contributor = z.object({
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
    example: 'https://contributor-site.com',
  }),
});

// Author schema
const Author = z.object({
  name: z.string().openapi({
    description: 'Name of the author',
    example: 'Developer Name',
  }),
  email: z.string().email().openapi({
    description: 'Email of the author',
    example: 'dev@example.com',
  }),
  url: z.string().url().optional().openapi({
    description: "URL of the author's website",
    example: 'https://example.com',
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
  identity: z.string().openapi({
    description: 'Unique composite identifier',
    example: 'ToolVersionDef|@vincent/foo-bar@1.0.0',
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
    example: ['@vincent/foo-bar-policy-1', '@vincent/foo-bar-policy-2'],
  }),
  ipfsCid: z.string().openapi({
    description: 'IPFS CID',
    example: 'QmdoY1VUxVvxShBQK5B6PP2jZFVw7PMTJ3qy2aiCARjMqo',
  }),
});

export const PolicyDef = z.object({
  packageName: z.string().openapi({
    description: 'Policy package name',
    example: '@vincent/foo-bar-policy',
  }),
  identity: z.string().openapi({
    description: 'Unique composite identifier',
    example: 'PolicyDef|@vincent/foo-bar-policy',
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

export const CreatePolicyDef = z.object({
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

export const PolicyVersionDef = z.object({
  packageName: z.string().openapi({
    description: 'Policy package name',
    example: '@vincent/foo-bar-policy',
  }),
  version: z.string().openapi({
    description: 'Policy version',
    example: '1.0.0',
  }),
  identity: z.string().openapi({
    description: 'Unique composite identifier',
    example: 'PolicyVersionDef|@vincent/foo-bar-policy@1.0.0',
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

export const EditPolicyDef = z.object({
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
export const CreatePolicyVersionDef = z.object({
  changes: z.string().openapi({
    description: 'Changelog information for this version',
    example: 'Extra foo on the bar!',
  }),
});

// Error response
export const Error = z.object({
  code: z.string().openapi({
    description: 'Error code',
    example: 'VALIDATION_ERROR',
  }),
  message: z.string().openapi({
    description: 'Error message',
    example: 'Invalid input provided',
  }),
});

// Request body for updating a tool version
export const VersionChanges = z.object({
  changes: z.string().openapi({
    description: 'Updated changelog information',
    example: 'Updated changelog information',
  }),
});

// Response body for deleting an application
export const DeleteResponse = z.object({
  message: z.string().openapi({
    description: 'Success message',
    example: 'Application successfully deleted',
  }),
});

// Register all the schemas
const CreateAppDefSchema = registry.register('ICreateAppDef', CreateAppDef);
const AppDefSchema = registry.register('IAppDef', AppDef);
const CreateAppVersionDefSchema = registry.register('ICreateAppVersionDef', CreateAppVersionDef);
const AppVersionDefSchema = registry.register('IAppVersionDef', AppVersionDef);
const AppVersionWithToolsDefSchema = registry.register(
  'IAppVersionWithToolsDef',
  AppVersionWithToolsDef,
);
const CreateToolDefSchema = registry.register('ICreateToolDef', CreateToolDef);
const EditToolDefSchema = registry.register('IEditToolDef', EditToolDef);
const ToolDefSchema = registry.register('IToolDef', ToolDef);
const ToolVersionDefSchema = registry.register('IToolVersionDef', ToolVersionDef);

const CreatePolicyDefSchema = registry.register('ICreatePolicyDef', CreatePolicyDef);
const EditPolicyDefSchema = registry.register('IEditPolicyDef', EditPolicyDef);
const PolicyDefSchema = registry.register('IPolicyDef', PolicyDef);
const PolicyVersionDefSchema = registry.register('IPolicyVersionDef', PolicyVersionDef);

const ErrorSchema = registry.register('Error', Error);
const DeleteResponseSchema = registry.register('DeleteResponse', DeleteResponse);
const VersionChangesSchema = registry.register('VersionChanges', VersionChanges);

// Register all the paths

// POST /app - Create a new application
registry.registerPath({
  method: 'post',
  path: '/app',
  tags: ['app'],
  summary: 'Creates a new application',
  operationId: 'createApp',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateAppDefSchema,
        },
      },
      description: 'Developer-defined application information',
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: AppDefSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
    },
    422: {
      description: 'Validation exception',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// GET /app/{appId} - Fetch an application
registry.registerPath({
  method: 'get',
  path: '/app/{appId}',
  tags: ['app'],
  summary: 'Fetches an application',
  operationId: 'getApp',
  parameters: [
    {
      name: 'appId',
      in: 'path',
      description: 'ID of the application to retrieve',
      required: true,
      schema: {
        type: 'number',
        example: 5,
      },
    },
  ],
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: AppDefSchema,
        },
      },
    },
    404: {
      description: 'Application not found',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// PUT /app/{appId} - Edit an application
registry.registerPath({
  method: 'put',
  path: '/app/{appId}',
  tags: ['app'],
  summary: 'Edits an application',
  operationId: 'editApp',
  parameters: [
    {
      name: 'appId',
      in: 'path',
      description: 'ID of the application to edit',
      required: true,
      schema: {
        type: 'number',
        example: 5,
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateAppDefSchema,
        },
      },
      description: 'Developer-defined updated application details',
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: AppDefSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
    },
    422: {
      description: 'Validation exception',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// DELETE /app/{appId} - Delete an application
registry.registerPath({
  method: 'delete',
  path: '/app/{appId}',
  tags: ['app'],
  summary: 'Deletes an application',
  operationId: 'deleteApp',
  parameters: [
    {
      name: 'appId',
      in: 'path',
      description: 'ID of the application to delete',
      required: true,
      schema: {
        type: 'number',
        example: 5,
      },
    },
  ],
  responses: {
    200: {
      description: 'OK - Resource successfully deleted',
      content: {
        'application/json': {
          schema: DeleteResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
    },
    422: {
      description: 'Validation exception',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// GET /app/{appId}/versions - Fetch all versions of an application
registry.registerPath({
  method: 'get',
  path: '/app/{appId}/versions',
  tags: ['app'],
  summary: 'Fetches all versions of an application',
  operationId: 'getAppVersions',
  parameters: [
    {
      name: 'appId',
      in: 'path',
      description: 'ID of the application whose versions will be fetched',
      required: true,
      schema: {
        type: 'number',
        example: 5,
      },
    },
  ],
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: z.array(AppVersionDef).openapi('AppVersionsArray'),
        },
      },
    },
    404: {
      description: 'Application not found',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// POST /app/{appId}/version - Create an application version
registry.registerPath({
  method: 'post',
  path: '/app/{appId}/version',
  tags: ['app/version'],
  summary: 'Creates an application version',
  operationId: 'createAppVersion',
  parameters: [
    {
      name: 'appId',
      in: 'path',
      description: 'ID of the application to create a new version for',
      required: true,
      schema: {
        type: 'number',
        example: 5,
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateAppVersionDefSchema,
        },
      },
      description: 'Developer-defined version details',
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: AppVersionDefSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
    },
    422: {
      description: 'Validation exception',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// GET /app/{appId}/version/{version} - Fetch an application version
registry.registerPath({
  method: 'get',
  path: '/app/{appId}/version/{version}',
  tags: ['app/version'],
  summary: 'Fetches an application version',
  operationId: 'getAppVersion',
  parameters: [
    {
      name: 'appId',
      in: 'path',
      description: 'ID of the application to retrieve a version for',
      required: true,
      schema: {
        type: 'number',
        example: 5,
      },
    },
    {
      name: 'version',
      in: 'path',
      description: 'Version number to retrieve',
      required: true,
      schema: {
        type: 'number',
        example: 2,
      },
    },
  ],
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: AppVersionWithToolsDefSchema,
        },
      },
    },
    404: {
      description: 'Application not found',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// PUT /app/{appId}/version/{version} - Edit an application version
registry.registerPath({
  method: 'put',
  path: '/app/{appId}/version/{version}',
  tags: ['app/version'],
  summary: 'Edits an application version',
  operationId: 'editAppVersion',
  parameters: [
    {
      name: 'appId',
      in: 'path',
      description: 'ID of the application to edit a version for',
      required: true,
      schema: {
        type: 'number',
        example: 5,
      },
    },
    {
      name: 'version',
      in: 'path',
      description: 'Version number to edit',
      required: true,
      schema: {
        type: 'number',
        example: 2,
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: VersionChangesSchema,
        },
      },
      description: 'Update version changes field',
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: AppVersionDefSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
    },
    422: {
      description: 'Validation exception',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// POST /app/{appId}/version/{version}/toggle - Toggle enabled/disabled for an application version
registry.registerPath({
  method: 'post',
  path: '/app/{appId}/version/{version}/toggle',
  tags: ['app/version'],
  summary: 'Toggles enabled/disabled for an application version',
  operationId: 'toggleAppVersion',
  parameters: [
    {
      name: 'appId',
      in: 'path',
      description: 'ID of the application to toggle a version for',
      required: true,
      schema: {
        type: 'number',
        example: 5,
      },
    },
    {
      name: 'version',
      in: 'path',
      description: 'Version number to toggle',
      required: true,
      schema: {
        type: 'number',
        example: 2,
      },
    },
  ],
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: AppVersionDefSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
    },
    422: {
      description: 'Validation exception',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// POST /tool - Create a new tool
registry.registerPath({
  method: 'post',
  path: '/tool',
  tags: ['tool'],
  summary: 'Creates a new tool',
  operationId: 'createTool',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateToolDefSchema,
        },
      },
      description: 'Developer-defined tool details',
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: ToolDefSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
    },
    422: {
      description: 'Validation exception',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// GET /tool/{packageName} - Fetch a tool
registry.registerPath({
  method: 'get',
  path: '/tool/{packageName}',
  tags: ['tool'],
  summary: 'Fetches a tool',
  operationId: 'getTool',
  parameters: [
    {
      name: 'packageName',
      in: 'path',
      description: 'Package name of the tool to retrieve',
      required: true,
      schema: {
        type: 'string',
        example: '@vincent/foo-bar',
      },
    },
  ],
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: ToolDefSchema,
        },
      },
    },
    404: {
      description: 'Tool not found',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// PUT /tool/{packageName} - Edit a tool
registry.registerPath({
  method: 'put',
  path: '/tool/{packageName}',
  tags: ['tool'],
  summary: 'Edits a tool',
  operationId: 'editTool',
  parameters: [
    {
      name: 'packageName',
      in: 'path',
      description: 'Package name of the tool to edit',
      required: true,
      schema: {
        type: 'string',
        example: '@vincent/foo-bar',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: EditToolDefSchema,
        },
      },
      description: 'Developer-defined updated tool details',
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: ToolDefSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
    },
    422: {
      description: 'Validation exception',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// GET /tool/{packageName}/versions - Fetch all versions of a tool
registry.registerPath({
  method: 'get',
  path: '/tool/{packageName}/versions',
  tags: ['tool'],
  summary: 'Fetches all versions of a tool',
  operationId: 'getToolVersions',
  parameters: [
    {
      name: 'packageName',
      in: 'path',
      description: 'Package name of the tool to fetch versions for',
      required: true,
      schema: {
        type: 'string',
        example: '@vincent/foo-bar',
      },
    },
  ],
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: z.array(ToolVersionDefSchema),
        },
      },
    },
    404: {
      description: 'Tool not found',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// PUT /tool/{packageName}/owner - Changes a tool's owner
registry.registerPath({
  method: 'put',
  path: '/tool/{packageName}/owner',
  tags: ['tool'],
  summary: "Changes a tool's owner",
  operationId: 'changeToolOwner',
  parameters: [
    {
      name: 'packageName',
      in: 'path',
      description: 'Package name of the tool to change the owner of',
      required: true,
      schema: {
        type: 'string',
        example: '@vincent/foo-bar',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            authorWalletAddress: z.string().openapi({
              description: 'New author wallet address',
              example: '0x1234567890123456789012345678901234567890',
            }),
          }),
        },
      },
      description: 'Developer-defined updated tool details',
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: ToolDefSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
    },
    422: {
      description: 'Validation exception',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// POST /tool/{packageName}/version - Create a tool version
registry.registerPath({
  method: 'post',
  path: '/tool/{packageName}/version',
  tags: ['tool/version'],
  summary: 'Creates a tool version',
  operationId: 'createToolVersion',
  parameters: [
    {
      name: 'packageName',
      in: 'path',
      description: 'Package name of the tool to create a new version for',
      required: true,
      schema: {
        type: 'string',
        example: '@vincent/foo-bar',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: VersionChangesSchema,
        },
      },
      description: 'Developer-defined version details',
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: ToolVersionDefSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
    },
    422: {
      description: 'Validation exception',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// GET /tool/{packageName}/version/{version} - Fetch a tool version
registry.registerPath({
  method: 'get',
  path: '/tool/{packageName}/version/{version}',
  tags: ['tool/version'],
  summary: 'Fetches a tool version',
  operationId: 'getToolVersion',
  parameters: [
    {
      name: 'packageName',
      in: 'path',
      description: 'Package name of the tool to retrieve a version for',
      required: true,
      schema: {
        type: 'string',
        example: '@vincent/foo-bar',
      },
    },
    {
      name: 'version',
      in: 'path',
      description: 'Version number to retrieve',
      required: true,
      schema: {
        type: 'string',
        example: '1.0.0',
      },
    },
  ],
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: ToolVersionDefSchema,
        },
      },
    },
    404: {
      description: 'Tool version not found',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// PUT /tool/{packageName}/version/{version} - Edit a tool version
registry.registerPath({
  method: 'put',
  path: '/tool/{packageName}/version/{version}',
  tags: ['tool/version'],
  summary: 'Edits a tool version',
  operationId: 'editToolVersion',
  parameters: [
    {
      name: 'packageName',
      in: 'path',
      description: 'Package name of the tool to edit a version for',
      required: true,
      schema: {
        type: 'string',
        example: '@vincent/foo-bar',
      },
    },
    {
      name: 'version',
      in: 'path',
      description: 'Version number to edit',
      required: true,
      schema: {
        type: 'string',
        example: '1.0.0',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: VersionChangesSchema,
        },
      },
      description: 'Update version changes field',
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: ToolVersionDefSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
    },
    422: {
      description: 'Validation exception',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// POST /policy - Create a new policy
registry.registerPath({
  method: 'post',
  path: '/policy',
  tags: ['policy'],
  summary: 'Creates a new policy',
  operationId: 'createPolicy',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreatePolicyDefSchema,
        },
      },
      description: 'Developer-defined policy details',
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: PolicyDefSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
    },
    422: {
      description: 'Validation exception',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// GET /policy/{packageName} - Fetch a policy
registry.registerPath({
  method: 'get',
  path: '/policy/{packageName}',
  tags: ['policy'],
  summary: 'Fetches a policy',
  operationId: 'getPolicy',
  parameters: [
    {
      name: 'packageName',
      in: 'path',
      description: 'Package name of the policy to retrieve',
      required: true,
      schema: {
        type: 'string',
        example: '@vincent/foo-bar-policy',
      },
    },
  ],
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: PolicyDefSchema,
        },
      },
    },
    404: {
      description: 'Policy not found',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// PUT /policy/{packageName} - Edit a policy
registry.registerPath({
  method: 'put',
  path: '/policy/{packageName}',
  tags: ['policy'],
  summary: 'Edits a policy',
  operationId: 'editPolicy',
  parameters: [
    {
      name: 'packageName',
      in: 'path',
      description: 'Package name of the policy to edit',
      required: true,
      schema: {
        type: 'string',
        example: '@vincent/foo-bar-policy',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: EditPolicyDefSchema,
        },
      },
      description: 'Developer-defined updated policy details',
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: PolicyDefSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
    },
    422: {
      description: 'Validation exception',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// POST /policy/{packageName}/version - Create a new policy version
registry.registerPath({
  method: 'post',
  path: '/policy/{packageName}/version',
  tags: ['policy/version'],
  summary: 'Creates a new policy version',
  operationId: 'createPolicyVersion',
  parameters: [
    {
      name: 'packageName',
      in: 'path',
      description: 'Package name of the policy to create a new version for',
      required: true,
      schema: {
        type: 'string',
        example: '@vincent/foo-bar-policy',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: VersionChangesSchema,
        },
      },
      description: 'Developer-defined version details',
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: PolicyVersionDefSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
    },
    422: {
      description: 'Validation exception',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// GET /policy/{packageName}/version/{version} - Fetch a policy version
registry.registerPath({
  method: 'get',
  path: '/policy/{packageName}/version/{version}',
  tags: ['policy/version'],
  summary: 'Fetches a policy version',
  operationId: 'getPolicyVersion',
  parameters: [
    {
      name: 'packageName',
      in: 'path',
      description: 'Package name of the policy to retrieve a version for',
      required: true,
      schema: {
        type: 'string',
        example: '@vincent/foo-bar-policy',
      },
    },
    {
      name: 'version',
      in: 'path',
      description: 'Version number to retrieve',
      required: true,
      schema: {
        type: 'string',
        example: '1.0.0',
      },
    },
  ],
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: PolicyVersionDefSchema,
        },
      },
    },
    404: {
      description: 'Policy version not found',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// GET /policy/{packageName}/versions - Fetch all versions of a policy
registry.registerPath({
  method: 'get',
  path: '/policy/{packageName}/versions',
  tags: ['policy'],
  summary: 'Fetches all versions of a policy',
  operationId: 'getPolicyVersions',
  parameters: [
    {
      name: 'packageName',
      in: 'path',
      description: 'Package name of the policy to fetch versions for',
      required: true,
      schema: {
        type: 'string',
        example: '@vincent/foo-bar-policy',
      },
    },
  ],
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: z.array(PolicyVersionDefSchema).openapi('PolicyVersionsArray'),
        },
      },
    },
    404: {
      description: 'Policy not found',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// PUT /policy/{packageName}/owner - Changes a policy's owner
registry.registerPath({
  method: 'put',
  path: '/policy/{packageName}/owner',
  tags: ['policy'],
  summary: "Changes a policy's owner",
  operationId: 'changePolicyOwner',
  parameters: [
    {
      name: 'packageName',
      in: 'path',
      description: 'Package name of the policy to change the owner of',
      required: true,
      schema: {
        type: 'string',
        example: '@vincent/foo-bar-policy',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            authorWalletAddress: z.string().openapi({
              description: 'New author wallet address',
              example: '0x1234567890123456789012345678901234567890',
            }),
          }),
        },
      },
      description: 'Developer-defined updated policy details',
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: PolicyDefSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
    },
    422: {
      description: 'Validation exception',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// PUT /policy/{packageName}/version/{version} - Edit a policy version
registry.registerPath({
  method: 'put',
  path: '/policy/{packageName}/version/{version}',
  tags: ['policy/version'],
  summary: 'Edits a policy version',
  operationId: 'editPolicyVersion',
  parameters: [
    {
      name: 'packageName',
      in: 'path',
      description: 'Package name of the policy to edit a version for',
      required: true,
      schema: {
        type: 'string',
        example: '@vincent/foo-bar-policy',
      },
    },
    {
      name: 'version',
      in: 'path',
      description: 'Version number to edit',
      required: true,
      schema: {
        type: 'string',
        example: '1.0.0',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: VersionChangesSchema,
        },
      },
      description: 'Update version changes field',
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: PolicyVersionDefSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
    },
    422: {
      description: 'Validation exception',
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// Export types
export type CreateAppDef = z.infer<typeof CreateAppDef>;
export type AppDef = z.infer<typeof AppDef>;
export type CreateAppVersionDef = z.infer<typeof CreateAppVersionDef>;
export type AppVersionDef = z.infer<typeof AppVersionDef>;
export type AppToolDef = z.infer<typeof AppToolDef>;
export type AppVersionWithToolsDef = z.infer<typeof AppVersionWithToolsDef>;
export type CreateToolDef = z.infer<typeof CreateToolDef>;
export type EditToolDef = z.infer<typeof EditToolDef>;
export type ToolDef = z.infer<typeof ToolDef>;
export type CreateToolVersionDef = z.infer<typeof CreateToolVersionDef>;
export type ToolVersionDef = z.infer<typeof ToolVersionDef>;
export type CreatePolicyDef = z.infer<typeof CreatePolicyDef>;
export type PolicyDef = z.infer<typeof PolicyDef>;
export type EditPolicyDef = z.infer<typeof EditPolicyDef>;
export type PolicyVersionDef = z.infer<typeof PolicyVersionDef>;
export type ErrorType = z.infer<typeof Error>;
export type VersionChanges = z.infer<typeof VersionChanges>;
export type DeleteResponse = z.infer<typeof DeleteResponse>;

// Export the registry
export { registry };
