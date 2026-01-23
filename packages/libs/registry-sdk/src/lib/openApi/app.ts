import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import { appDoc, appCreate, appEdit, appSetActiveVersion } from '../schemas/app';
import {
  appVersionDoc,
  appVersionAbilityCreate,
  appVersionAbilityEdit,
  appVersionAbilityDoc,
} from '../schemas/appVersion';
import {
  executeBatchAbilityRequest,
  executeBatchAbilityResponse,
} from '../schemas/executeBatchAbility';
import { z } from '../schemas/openApiZod';
import { GenericResult, ErrorResponse, siweAuth } from './baseRegistry';

export const appIdParam = z
  .number()
  .openapi({ param: { description: 'ID of the target application', example: 132 } });

const appVersionParam = z
  .number()
  .openapi({ param: { description: 'Version # of the target application version', example: 3 } });

const packageNameParam = z
  .string()
  .openapi({ param: { description: 'The NPM package name', example: '@vincent/foo-bar' } });

export function addToRegistry(registry: OpenAPIRegistry) {
  const AppCreate = registry.register('AppCreate', appCreate);
  const AppEdit = registry.register('AppEdit', appEdit);
  const AppRead = registry.register('App', appDoc);
  const AppSetActiveVersion = registry.register('AppSetActiveVersion', appSetActiveVersion);

  const AppVersionRead = registry.register('AppVersion', appVersionDoc);

  const AppVersionAbilityCreate = registry.register(
    'AppVersionAbilityCreate',
    appVersionAbilityCreate,
  );
  const AppVersionAbilityEdit = registry.register('AppVersionAbilityEdit', appVersionAbilityEdit);
  const AppVersionAbilityRead = registry.register('AppVersionAbility', appVersionAbilityDoc);

  // GET /apps - List all applications
  registry.registerPath({
    method: 'get',
    path: '/apps',
    tags: ['App'],
    summary: 'Lists all applications',
    operationId: 'listApps',
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: z.array(AppRead).openapi('AppList'),
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

  // POST /app - Create a new application
  registry.registerPath({
    method: 'post',
    path: '/app',
    tags: ['App', 'AppVersion'],
    summary: 'Creates a new application',
    operationId: 'createApp',
    security: [{ [siweAuth.name]: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: AppCreate,
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
            schema: AppRead,
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

  // GET /app/{appId} - Fetch an application
  registry.registerPath({
    method: 'get',
    path: '/app/{appId}',
    tags: ['App'],
    summary: 'Fetches an application',
    operationId: 'getApp',
    request: {
      params: z.object({ appId: appIdParam }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AppRead,
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
            schema: ErrorResponse,
          },
        },
      },
    },
  });

  // PUT /app/{appId} - Edit an application
  registry.registerPath({
    method: 'put',
    path: '/app/{appId}',
    tags: ['App'],
    summary: 'Edits an application',
    operationId: 'editApp',
    security: [{ [siweAuth.name]: [] }],
    request: {
      params: z.object({
        appId: appIdParam,
      }),
      body: {
        content: {
          'application/json': {
            schema: AppEdit,
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
            schema: AppRead,
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

  // DELETE /app/{appId} - Delete an application
  registry.registerPath({
    method: 'delete',
    path: '/app/{appId}',
    tags: ['App', 'AppVersion', 'AppVersionAbility'],
    summary: 'Deletes an application',
    operationId: 'deleteApp',
    security: [{ [siweAuth.name]: [] }],
    request: {
      params: z.object({
        appId: appIdParam,
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

  // POST /app/{appId}/undelete - Undelete an application
  registry.registerPath({
    method: 'post',
    path: '/app/{appId}/undelete',
    tags: ['App', 'AppVersion', 'AppVersionAbility'],
    summary: 'Undeletes an application',
    operationId: 'undeleteApp',
    security: [{ [siweAuth.name]: [] }],
    request: {
      params: z.object({
        appId: appIdParam,
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

  // GET /app/{appId}/versions - Fetch all versions of an application
  registry.registerPath({
    method: 'get',
    path: '/app/{appId}/versions',
    tags: ['AppVersion'],
    summary: 'Fetches all versions of an application',
    operationId: 'getAppVersions',
    request: {
      params: z.object({
        appId: appIdParam,
      }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: z.array(AppVersionRead).openapi('AppVersionList'),
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
            schema: ErrorResponse,
          },
        },
      },
    },
  });

  // GET /app/{appId}/version/{version} - Fetch an application version
  registry.registerPath({
    method: 'get',
    path: '/app/{appId}/version/{version}',
    tags: ['AppVersion'],
    summary: 'Fetches an application version',
    operationId: 'getAppVersion',
    request: {
      params: z.object({
        appId: appIdParam,
        version: appVersionParam,
      }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AppVersionRead,
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
            schema: ErrorResponse,
          },
        },
      },
    },
  });

  // POST /app/{appId}/version - Create an application version
  registry.registerPath({
    method: 'post',
    path: '/app/{appId}/version',
    tags: ['AppVersion'],
    summary: 'Creates an application version',
    operationId: 'createAppVersion',
    security: [{ [siweAuth.name]: [] }],
    request: {
      params: z.object({
        appId: appIdParam,
      }),
    },
    responses: {
      201: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AppVersionRead,
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

  // GET /app/{appId}/version/{version}/abilities - List all abilities for an application version
  registry.registerPath({
    method: 'get',
    path: '/app/{appId}/version/{version}/abilities',
    tags: ['AppVersionAbility'],
    summary: 'Lists all abilities for an application version',
    operationId: 'listAppVersionAbilities',
    request: {
      params: z.object({
        appId: appIdParam,
        version: appVersionParam,
      }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: z.array(AppVersionAbilityRead).openapi('AppVersionAbilityList'),
          },
        },
      },
      404: {
        description: 'Application or version not found',
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

  // POST /app/{appId}/version/{appVersion}/ability/{abilityPackageName} - Create an ability for an application version
  registry.registerPath({
    method: 'post',
    path: '/app/{appId}/version/{appVersion}/ability/{abilityPackageName}',
    tags: ['AppVersionAbility'],
    summary: 'Creates an ability for an application version',
    operationId: 'createAppVersionAbility',
    security: [{ [siweAuth.name]: [] }],
    request: {
      params: z.object({
        appId: appIdParam,
        appVersion: appVersionParam,
        abilityPackageName: packageNameParam,
      }),
      body: {
        content: {
          'application/json': {
            schema: AppVersionAbilityCreate,
          },
        },
        description: 'Ability configuration for the application version',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AppVersionAbilityRead,
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

  // PUT /app/{appId}/version/{appVersion}/ability/{abilityPackageName} - Edit an ability for an application version
  registry.registerPath({
    method: 'put',
    path: '/app/{appId}/version/{appVersion}/ability/{abilityPackageName}',
    tags: ['AppVersionAbility'],
    summary: 'Edits an ability for an application version',
    operationId: 'editAppVersionAbility',
    security: [{ [siweAuth.name]: [] }],
    request: {
      params: z.object({
        appId: appIdParam,
        appVersion: appVersionParam,
        abilityPackageName: packageNameParam,
      }),
      body: {
        content: {
          'application/json': {
            schema: AppVersionAbilityEdit,
          },
        },
        description: 'Updated ability configuration for the application version',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AppVersionAbilityRead,
          },
        },
      },
      400: {
        description: 'Invalid input',
      },
      404: {
        description: 'Application, version, or ability not found',
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

  // DELETE /app/{appId}/version/{appVersion}/ability/{abilityPackageName} - Delete an ability for an application version
  registry.registerPath({
    method: 'delete',
    path: '/app/{appId}/version/{appVersion}/ability/{abilityPackageName}',
    tags: ['AppVersionAbility'],
    summary: 'Deletes an ability for an application version',
    operationId: 'deleteAppVersionAbility',
    security: [{ [siweAuth.name]: [] }],
    request: {
      params: z.object({
        appId: appIdParam,
        appVersion: appVersionParam,
        abilityPackageName: packageNameParam,
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
        description: 'Application, version, or ability not found',
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

  // POST /app/{appId}/version/{appVersion}/ability/{abilityPackageName}/undelete - Undelete an ability for an application version
  registry.registerPath({
    method: 'post',
    path: '/app/{appId}/version/{appVersion}/ability/{abilityPackageName}/undelete',
    tags: ['AppVersionAbility'],
    summary: 'Undeletes an ability for an application version',
    operationId: 'undeleteAppVersionAbility',
    security: [{ [siweAuth.name]: [] }],
    request: {
      params: z.object({
        appId: appIdParam,
        appVersion: appVersionParam,
        abilityPackageName: packageNameParam,
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
        description: 'Application, version, or ability not found',
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

  // POST /app/{appId}/setActiveVersion - Set the active version of an application
  registry.registerPath({
    method: 'post',
    path: '/app/{appId}/setActiveVersion',
    tags: ['App'],
    summary: 'Sets the active version of an application',
    operationId: 'setAppActiveVersion',
    security: [{ [siweAuth.name]: [] }],
    request: {
      params: z.object({ appId: appIdParam }),
      body: {
        content: {
          'application/json': {
            schema: AppSetActiveVersion,
          },
        },
        description: 'The version to set as active',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'OK - Active version successfully set',
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
        description: 'Application or version not found',
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

  const abilityNameParam = z
    .string()
    .openapi({
      param: {
        description: 'URL-friendly ability name (e.g., "relay-link")',
        example: 'relay-link',
      },
    });

  const ExecuteBatchAbilityRequest = registry.register(
    'ExecuteBatchAbilityRequest',
    executeBatchAbilityRequest,
  );
  const ExecuteBatchAbilityResponse = registry.register(
    'ExecuteBatchAbilityResponse',
    executeBatchAbilityResponse,
  );

  // POST /app/{abilityName}/execute - Execute an ability for multiple delegators in batch
  registry.registerPath({
    method: 'post',
    path: '/app/{abilityName}/execute',
    tags: ['App', 'Ability'],
    summary: 'Executes an ability for multiple delegators in batch',
    description:
      'Executes a Vincent ability for multiple delegators using a shared delegatee private key. ' +
      'Each delegator can have custom parameters that override the defaults. ' +
      'The delegatee app ID is automatically looked up from the private key.',
    operationId: 'executeBatchAbility',
    request: {
      params: z.object({
        abilityName: abilityNameParam,
      }),
      body: {
        content: {
          'application/json': {
            schema: ExecuteBatchAbilityRequest,
          },
        },
        description: 'Batch execution request with delegatee credentials and delegator parameters',
        required: true,
      },
    },
    responses: {
      200: {
        description:
          'Batch execution completed (some delegators may have failed, check individual results)',
        content: {
          'application/json': {
            schema: ExecuteBatchAbilityResponse,
          },
        },
      },
      400: {
        description: 'Invalid input (missing required fields or invalid delegators array)',
      },
      500: {
        description: 'Server error (ability not supported, app not found, etc.)',
        content: {
          'application/json': {
            schema: ErrorResponse,
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
}
