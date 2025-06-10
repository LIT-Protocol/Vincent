import { CreateTool, EditTool, ToolDef, ToolVersionDef } from '../schemas/tool';
import { ErrorSchema, VersionChangesSchema } from './baseRegistry';
import { z } from '../schemas/openApiZod';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

export function addToRegistry(registry: OpenAPIRegistry) {
  const CreateToolSchema = registry.register('CreateTool', CreateTool);
  const EditToolSchema = registry.register('EditTool', EditTool);
  const ToolDefSchema = registry.register('ToolDef', ToolDef);
  const ToolVersionDefSchema = registry.register('ToolVersionDef', ToolVersionDef);

  // GET /tools - List all tools
  registry.registerPath({
    method: 'get',
    path: '/tools',
    tags: ['tool'],
    summary: 'Lists all tools',
    operationId: 'listAllTools',
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: z.array(ToolDefSchema),
          },
        },
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
            schema: CreateToolSchema,
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
            schema: EditToolSchema,
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
}
