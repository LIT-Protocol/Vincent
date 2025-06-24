import { z } from '../schemas/openApiZod';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import {
  policyCreate,
  policyEdit,
  policyDoc,
  policyVersionCreate,
  policyVersionEdit,
  policyVersionDoc,
} from '../schemas/policy';
import { ErrorResponse, ChangeOwner } from './baseRegistry';

const packageNameParam = z
  .string()
  .openapi({ param: { description: 'The NPM package name', example: '@vincent/foo-bar' } });

const policyVersionParam = z
  .string()
  .openapi({ param: { description: 'NPM semver of the target policy version', example: '2.1.0' } });

export function addToRegistry(registry: OpenAPIRegistry) {
  const PolicyCreate = registry.register('PolicyCreate', policyCreate);
  const PolicyEdit = registry.register('PolicyEdit', policyEdit);
  const PolicyRead = registry.register('Policy', policyDoc);

  const PolicyVersionCreate = registry.register('PolicyVersionCreate', policyVersionCreate);
  const PolicyVersionEdit = registry.register('PolicyVersionEdit', policyVersionEdit);
  const PolicyVersionRead = registry.register('PolicyVersion', policyVersionDoc);

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
            schema: z.array(PolicyRead).openapi('PolicyList'),
          },
        },
      },
      default: {
        description: 'Unexpected error',
        content: {
          'application/json': {
            schema: ErrorResponse,
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
            schema: PolicyCreate,
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
            schema: PolicyRead,
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
            schema: ErrorResponse,
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
    request: {
      params: z.object({ packageName: packageNameParam }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: PolicyRead,
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
            schema: ErrorResponse,
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
    request: {
      params: z.object({ packageName: packageNameParam }),
      body: {
        content: {
          'application/json': {
            schema: PolicyEdit,
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
            schema: PolicyRead,
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
            schema: ErrorResponse,
          },
        },
      },
    },
  });

  // POST /policy/{packageName}/version/{version} - Create a new policy version
  registry.registerPath({
    method: 'post',
    path: '/policy/{packageName}/version/{version}',
    tags: ['policy/version'],
    summary: 'Creates a new policy version',
    operationId: 'createPolicyVersion',
    request: {
      params: z.object({ packageName: packageNameParam, version: policyVersionParam }),
      body: {
        content: {
          'application/json': {
            schema: PolicyVersionCreate,
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
            schema: PolicyVersionRead,
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
            schema: ErrorResponse,
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
    request: {
      params: z.object({ packageName: packageNameParam, version: policyVersionParam }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: PolicyVersionRead,
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
            schema: ErrorResponse,
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
    request: {
      params: z.object({ packageName: packageNameParam }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: z.array(PolicyVersionRead).openapi('PolicyVersionList'),
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
            schema: ErrorResponse,
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
    request: {
      params: z.object({ packageName: packageNameParam }),
      body: {
        content: {
          'application/json': {
            schema: ChangeOwner,
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
            schema: PolicyRead,
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
            schema: ErrorResponse,
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
    request: {
      params: z.object({ packageName: packageNameParam, version: policyVersionParam }),
      body: {
        content: {
          'application/json': {
            schema: PolicyVersionEdit,
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
            schema: PolicyVersionRead,
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
            schema: ErrorResponse,
          },
        },
      },
    },
  });
}
