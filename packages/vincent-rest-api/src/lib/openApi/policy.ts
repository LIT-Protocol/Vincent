import { CreatePolicy, EditPolicy, PolicyDef, PolicyVersionDef } from '../schemas/policy';
import { ErrorSchema, VersionChangesSchema } from './baseRegistry';
import { z } from '../schemas/openApiZod';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

export function addToRegistry(registry: OpenAPIRegistry) {
  const CreatePolicySchema = registry.register('CreatePolicyDef', CreatePolicy);
  const EditPolicySchema = registry.register('EditPolicyDef', EditPolicy);
  const PolicyDefSchema = registry.register('PolicyDef', PolicyDef);
  const PolicyVersionDefSchema = registry.register('PolicyVersionDef', PolicyVersionDef);

  registry.registerPath({
    method: 'get',
    path: '/policies',
    tags: ['policy'],
    summary: 'Lists all policies',
    operationId: 'listAllPolicies',
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: z.array(PolicyDefSchema),
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
            schema: CreatePolicySchema,
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
            schema: EditPolicySchema,
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
}
