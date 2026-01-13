import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import { z } from '../schemas/openApiZod';
import {
  policyCreate,
  policyEdit,
  policyDoc,
  policyVersionCreate,
  policyVersionEdit,
  policyVersionDoc,
} from '../schemas/policy';
import { ErrorResponse, ChangeOwner, GenericResult, siweAuth } from './baseRegistry';

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
    tags: ['Policy'],
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

  // POST /policy/{packageName} - Create a new policy
  registry.registerPath({
    method: 'post',
    path: '/policy/{packageName}',
    tags: ['Policy', 'PolicyVersion'],
    summary: 'Creates a new policy',
    operationId: 'createPolicy',
    security: [{ [siweAuth.name]: [] }],
    request: {
      params: z.object({ packageName: packageNameParam }),
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
    tags: ['Policy'],
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
    tags: ['Policy'],
    summary: 'Edits a policy',
    operationId: 'editPolicy',
    security: [{ [siweAuth.name]: [] }],
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
    tags: ['PolicyVersion'],
    summary: 'Creates a new policy version',
    operationId: 'createPolicyVersion',
    security: [{ [siweAuth.name]: [] }],
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
    tags: ['PolicyVersion'],
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
    tags: ['PolicyVersion'],
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
    tags: ['Policy'],
    summary: "Changes a policy's owner",
    operationId: 'changePolicyOwner',
    security: [{ [siweAuth.name]: [] }],
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
    tags: ['PolicyVersion'],
    summary: 'Edits a policy version',
    operationId: 'editPolicyVersion',
    security: [{ [siweAuth.name]: [] }],
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

  // DELETE /policy/{packageName} - Delete a policy and all its versions
  registry.registerPath({
    method: 'delete',
    path: '/policy/{packageName}',
    tags: ['Policy', 'PolicyVersion'],
    summary: 'Deletes a policy and all its versions',
    operationId: 'deletePolicy',
    security: [{ [siweAuth.name]: [] }],
    request: {
      params: z.object({ packageName: packageNameParam }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: GenericResult,
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

  // POST /policy/{packageName}/undelete - Undelete a policy and all its versions
  registry.registerPath({
    method: 'post',
    path: '/policy/{packageName}/undelete',
    tags: ['Policy', 'PolicyVersion'],
    summary: 'Undeletes a policy and all its versions',
    operationId: 'undeletePolicy',
    security: [{ [siweAuth.name]: [] }],
    request: {
      params: z.object({ packageName: packageNameParam }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: GenericResult,
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

  // DELETE /policy/{packageName}/version/{version} - Delete a policy version
  registry.registerPath({
    method: 'delete',
    path: '/policy/{packageName}/version/{version}',
    tags: ['PolicyVersion'],
    summary: 'Deletes a policy version',
    operationId: 'deletePolicyVersion',
    security: [{ [siweAuth.name]: [] }],
    request: {
      params: z.object({
        packageName: packageNameParam,
        version: policyVersionParam,
      }),
    },
    responses: {
      200: {
        description: 'OK - Resource successfully deleted',
        content: {
          'application/json': {
            schema: GenericResult,
          },
        },
      },
      400: {
        description: 'Invalid input',
      },
      404: {
        description: 'Policy or version not found',
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

  // POST /policy/{packageName}/version/{version}/undelete - Undelete a policy version
  registry.registerPath({
    method: 'post',
    path: '/policy/{packageName}/version/{version}/undelete',
    tags: ['PolicyVersion'],
    summary: 'Undeletes a policy version',
    operationId: 'undeletePolicyVersion',
    security: [{ [siweAuth.name]: [] }],
    request: {
      params: z.object({
        packageName: packageNameParam,
        version: policyVersionParam,
      }),
    },
    responses: {
      200: {
        description: 'OK - Resource successfully undeleted',
        content: {
          'application/json': {
            schema: GenericResult,
          },
        },
      },
      400: {
        description: 'Invalid input',
      },
      404: {
        description: 'Policy or version not found',
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
