import { z } from '../schemas/openApiZod';

import {
  AppVersionDef,
  AppVersionWithTools,
  CreateApp,
  CreateAppVersion,
  EditApp,
} from '../schemas/app';
import { DeleteResponseSchema, ErrorSchema, VersionChangesSchema } from './baseRegistry';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

export function addToRegistry(registry: OpenAPIRegistry) {
  const CreateAppSchema = registry.register('CreateApp', CreateApp);
  const EditAppSchema = registry.register('EditApp', EditApp);
  const CreateAppVersionSchema = registry.register('CreateAppVersion', CreateAppVersion);
  const AppVersionDefSchema = registry.register('AppVersionDef', AppVersionDef);
  const AppVersionWithToolsSchema = registry.register('AppVersionWithTools', AppVersionWithTools);

  // GET /apps - List all applications
  registry.registerPath({
    method: 'get',
    path: '/apps',
    tags: ['app'],
    summary: 'Lists all applications',
    operationId: 'listApps',
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: z.array(CreateApp),
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
            schema: CreateAppSchema,
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
            schema: CreateApp,
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
            schema: CreateApp,
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
            schema: EditAppSchema,
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
            schema: CreateApp,
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
            schema: CreateAppVersionSchema,
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
            schema: AppVersionWithToolsSchema,
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
  // POST /app/{appId}/version/{version}/enable - Enable an application version
  registry.registerPath({
    method: 'post',
    path: '/app/{appId}/version/{version}/enable',
    tags: ['app/version'],
    summary: 'Enables an application version',
    operationId: 'enableAppVersion',
    parameters: [
      {
        name: 'appId',
        in: 'path',
        description: 'ID of the application to enable a version for',
        required: true,
        schema: {
          type: 'number',
          example: 5,
        },
      },
      {
        name: 'version',
        in: 'path',
        description: 'Version number to enable',
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

  // POST /app/{appId}/version/{version}/disable - Disable an application version
  registry.registerPath({
    method: 'post',
    path: '/app/{appId}/version/{version}/disable',
    tags: ['app/version'],
    summary: 'Disables an application version',
    operationId: 'disableAppVersion',
    parameters: [
      {
        name: 'appId',
        in: 'path',
        description: 'ID of the application to disable a version for',
        required: true,
        schema: {
          type: 'number',
          example: 5,
        },
      },
      {
        name: 'version',
        in: 'path',
        description: 'Version number to disable',
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
}
