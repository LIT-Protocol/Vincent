import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import {
  abilityCreate,
  abilityEdit,
  abilityDoc,
  abilityVersionCreate,
  abilityVersionEdit,
  abilityVersionDoc,
} from '../schemas/ability';
import { z } from '../schemas/openApiZod';
import { ErrorResponse, ChangeOwner, GenericResult, jwtAuth } from './baseRegistry';

const packageNameParam = z
  .string()
  .openapi({ param: { description: 'The NPM package name', example: '@vincent/foo-bar' } });

const abilityVersionParam = z.string().openapi({
  param: { description: 'NPM semver of the target ability version', example: '2.1.0' },
});

export function addToRegistry(registry: OpenAPIRegistry) {
  const AbilityCreate = registry.register('AbilityCreate', abilityCreate);
  const AbilityEdit = registry.register('AbilityEdit', abilityEdit);
  const AbilityRead = registry.register('Ability', abilityDoc);

  const AbilityVersionCreate = registry.register('AbilityVersionCreate', abilityVersionCreate);
  const AbilityVersionEdit = registry.register('AbilityVersionEdit', abilityVersionEdit);
  const AbilityVersionRead = registry.register('AbilityVersion', abilityVersionDoc);

  // GET /abilities - List all abilities
  registry.registerPath({
    method: 'get',
    path: '/abilities',
    tags: ['Ability'],
    summary: 'Lists all abilities',
    operationId: 'listAllAbilities',
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: z.array(AbilityRead).openapi('AbilityList'),
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

  // POST /ability/{packageName} - Create a new tool
  registry.registerPath({
    method: 'post',
    path: '/ability/{packageName}',
    tags: ['Ability', 'AbilityVersion'],
    summary: 'Creates a new ability',
    operationId: 'createAbility',
    security: [{ [jwtAuth.name]: [] }],
    request: {
      params: z.object({ packageName: packageNameParam }),
      body: {
        content: {
          'application/json': {
            schema: AbilityCreate,
          },
        },
        description: 'Developer-defined ability details',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AbilityRead,
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

  // GET /ability/{packageName} - Fetch an ability
  registry.registerPath({
    method: 'get',
    path: '/ability/{packageName}',
    tags: ['Ability'],
    summary: 'Fetches an ability',
    operationId: 'getAbility',
    request: {
      params: z.object({ packageName: packageNameParam }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AbilityRead,
          },
        },
      },
      404: {
        description: 'Ability not found',
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

  // PUT /ability/{packageName} - Edit an ability
  registry.registerPath({
    method: 'put',
    path: '/ability/{packageName}',
    tags: ['Ability'],
    summary: 'Edits an ability',
    operationId: 'editAbility',
    security: [{ [jwtAuth.name]: [] }],
    request: {
      params: z.object({ packageName: packageNameParam }),
      body: {
        content: {
          'application/json': {
            schema: AbilityEdit,
          },
        },
        description: 'Developer-defined updated ability details',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AbilityRead,
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

  // GET /ability/{packageName}/versions - Fetch all versions of an ability
  registry.registerPath({
    method: 'get',
    path: '/ability/{packageName}/versions',
    tags: ['AbilityVersion'],
    summary: 'Fetches all versions of an ability',
    operationId: 'getAbilityVersions',
    request: {
      params: z.object({ packageName: packageNameParam }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: z.array(AbilityVersionRead).openapi('AbilityVersionList'),
          },
        },
      },
      404: {
        description: 'Ability not found',
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

  // PUT /ability/{packageName}/owner - Changes an ability's owner
  registry.registerPath({
    method: 'put',
    path: '/ability/{packageName}/owner',
    tags: ['Ability'],
    summary: "Changes an ability's owner",
    operationId: 'changeAbilityOwner',
    security: [{ [jwtAuth.name]: [] }],
    request: {
      params: z.object({ packageName: packageNameParam }),
      body: {
        content: {
          'application/json': {
            schema: ChangeOwner,
          },
        },
        description: 'Developer-defined updated ability details',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AbilityRead,
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

  // POST /ability/{packageName}/version/{version} - Create an ability version
  registry.registerPath({
    method: 'post',
    path: '/ability/{packageName}/version/{version}',
    tags: ['AbilityVersion'],
    summary: 'Creates an ability version',
    operationId: 'createAbilityVersion',
    security: [{ [jwtAuth.name]: [] }],
    request: {
      params: z.object({ packageName: packageNameParam, version: abilityVersionParam }),
      body: {
        content: {
          'application/json': {
            schema: AbilityVersionCreate,
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
            schema: AbilityVersionRead,
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

  // GET /ability/{packageName}/version/{version} - Fetch an ability version
  registry.registerPath({
    method: 'get',
    path: '/ability/{packageName}/version/{version}',
    tags: ['AbilityVersion'],
    summary: 'Fetches an ability version',
    operationId: 'getAbilityVersion',
    request: {
      params: z.object({ packageName: packageNameParam, version: abilityVersionParam }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AbilityVersionRead,
          },
        },
      },
      404: {
        description: 'Ability version not found',
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

  // PUT /ability/{packageName}/version/{version} - Edit an ability version
  registry.registerPath({
    method: 'put',
    path: '/ability/{packageName}/version/{version}',
    tags: ['AbilityVersion'],
    summary: 'Edits an ability version',
    operationId: 'editAbilityVersion',
    security: [{ [jwtAuth.name]: [] }],
    request: {
      params: z.object({ packageName: packageNameParam, version: abilityVersionParam }),
      body: {
        content: {
          'application/json': {
            schema: AbilityVersionEdit,
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
            schema: AbilityVersionRead,
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

  // DELETE /ability/{packageName} - Delete an ability and all its versions
  registry.registerPath({
    method: 'delete',
    path: '/ability/{packageName}',
    tags: ['Ability', 'AbilityVersion'],
    summary: 'Deletes an ability and all its versions',
    operationId: 'deleteAbility',
    security: [{ [jwtAuth.name]: [] }],
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
        description: 'Ability not found',
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

  // POST /ability/{packageName}/undelete - Undelete an ability and all its versions
  registry.registerPath({
    method: 'post',
    path: '/ability/{packageName}/undelete',
    tags: ['Ability', 'AbilityVersion'],
    summary: 'Undeletes an ability and all its versions',
    operationId: 'undeleteAbility',
    security: [{ [jwtAuth.name]: [] }],
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
        description: 'Ability not found',
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

  // DELETE /ability/{packageName}/version/{version} - Delete an ability version
  registry.registerPath({
    method: 'delete',
    path: '/ability/{packageName}/version/{version}',
    tags: ['AbilityVersion'],
    summary: 'Deletes an ability version',
    operationId: 'deleteAbilityVersion',
    security: [{ [jwtAuth.name]: [] }],
    request: {
      params: z.object({
        packageName: packageNameParam,
        version: abilityVersionParam,
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
        description: 'Ability or version not found',
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

  // POST /ability/{packageName}/version/{version}/undelete - Undelete an ability version
  registry.registerPath({
    method: 'post',
    path: '/ability/{packageName}/version/{version}/undelete',
    tags: ['AbilityVersion'],
    summary: 'Undeletes an ability version',
    operationId: 'undeleteAbilityVersion',
    security: [{ [jwtAuth.name]: [] }],
    request: {
      params: z.object({
        packageName: packageNameParam,
        version: abilityVersionParam,
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
        description: 'Ability or version not found',
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
