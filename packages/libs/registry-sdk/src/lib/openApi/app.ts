import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import { appDoc, appCreate, appEdit, appSetActiveVersion } from '../schemas/app';
import {
  appVersionDoc,
  appVersionCreate,
  appVersionEdit,
  appVersionToolCreate,
  appVersionToolEdit,
  appVersionToolDoc,
} from '../schemas/appVersion';
import { z } from '../schemas/openApiZod';
import { GenericResult, ErrorResponse, jwtAuth } from './baseRegistry';

const appIdParam = z
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

  const AppVersionCreate = registry.register('AppVersionCreate', appVersionCreate);
  const AppVersionEdit = registry.register('AppVersionEdit', appVersionEdit);
  const AppVersionRead = registry.register('AppVersion', appVersionDoc);

  const AppVersionToolCreate = registry.register('AppVersionToolCreate', appVersionToolCreate);
  const AppVersionToolEdit = registry.register('AppVersionToolEdit', appVersionToolEdit);
  const AppVersionToolRead = registry.register('AppVersionTool', appVersionToolDoc);

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
    security: [{ [jwtAuth.name]: [] }],
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
    security: [{ [jwtAuth.name]: [] }],
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
    tags: ['App', 'AppVersion', 'AppVersionTool'],
    summary: 'Deletes an application',
    operationId: 'deleteApp',
    security: [{ [jwtAuth.name]: [] }],
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
    tags: ['App', 'AppVersion', 'AppVersionTool'],
    summary: 'Undeletes an application',
    operationId: 'undeleteApp',
    security: [{ [jwtAuth.name]: [] }],
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

  // POST /app/{appId}/version/{version} - Create an application version
  registry.registerPath({
    method: 'post',
    path: '/app/{appId}/version',
    tags: ['AppVersion'],
    summary: 'Creates an application version',
    operationId: 'createAppVersion',
    security: [{ [jwtAuth.name]: [] }],
    request: {
      params: z.object({
        appId: appIdParam,
      }),
      body: {
        content: {
          'application/json': {
            schema: AppVersionCreate,
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

  // PUT /app/{appId}/version/{version} - Edit an application version
  registry.registerPath({
    method: 'put',
    path: '/app/{appId}/version/{version}',
    tags: ['AppVersion'],
    summary: 'Edits an application version',
    operationId: 'editAppVersion',
    security: [{ [jwtAuth.name]: [] }],
    request: {
      params: z.object({
        appId: appIdParam,
        version: appVersionParam,
      }),
      body: {
        content: {
          'application/json': {
            schema: AppVersionEdit,
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

  // POST /app/{appId}/version/{version}/enable - Enable an application version
  registry.registerPath({
    method: 'post',
    path: '/app/{appId}/version/{version}/enable',
    tags: ['AppVersion'],
    summary: 'Enables an application version',
    operationId: 'enableAppVersion',
    security: [{ [jwtAuth.name]: [] }],
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

  // POST /app/{appId}/version/{version}/disable - Disable an application version
  registry.registerPath({
    method: 'post',
    path: '/app/{appId}/version/{version}/disable',
    tags: ['AppVersion'],
    summary: 'Disables an application version',
    operationId: 'disableAppVersion',
    security: [{ [jwtAuth.name]: [] }],
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

  // GET /app/{appId}/version/{version}/tools - List all tools for an application version
  registry.registerPath({
    method: 'get',
    path: '/app/{appId}/version/{version}/tools',
    tags: ['AppVersionTool'],
    summary: 'Lists all tools for an application version',
    operationId: 'listAppVersionTools',
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
            schema: z.array(AppVersionToolRead).openapi('AppVersionToolList'),
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

  // POST /app/{appId}/version/{appVersion}/tool/{toolPackageName} - Create a tool for an application version
  registry.registerPath({
    method: 'post',
    path: '/app/{appId}/version/{appVersion}/tool/{toolPackageName}',
    tags: ['AppVersionTool'],
    summary: 'Creates a tool for an application version',
    operationId: 'createAppVersionTool',
    security: [{ [jwtAuth.name]: [] }],
    request: {
      params: z.object({
        appId: appIdParam,
        appVersion: appVersionParam,
        toolPackageName: packageNameParam,
      }),
      body: {
        content: {
          'application/json': {
            schema: AppVersionToolCreate,
          },
        },
        description: 'Tool configuration for the application version',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AppVersionToolRead,
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

  // PUT /app/{appId}/version/{appVersion}/tool/{toolPackageName} - Edit a tool for an application version
  registry.registerPath({
    method: 'put',
    path: '/app/{appId}/version/{appVersion}/tool/{toolPackageName}',
    tags: ['AppVersionTool'],
    summary: 'Edits a tool for an application version',
    operationId: 'editAppVersionTool',
    security: [{ [jwtAuth.name]: [] }],
    request: {
      params: z.object({
        appId: appIdParam,
        appVersion: appVersionParam,
        toolPackageName: packageNameParam,
      }),
      body: {
        content: {
          'application/json': {
            schema: AppVersionToolEdit,
          },
        },
        description: 'Updated tool configuration for the application version',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AppVersionToolRead,
          },
        },
      },
      400: {
        description: 'Invalid input',
      },
      404: {
        description: 'Application, version, or tool not found',
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

  // DELETE /app/{appId}/version/{version} - Delete an application version and its AppVersionTools
  registry.registerPath({
    method: 'delete',
    path: '/app/{appId}/version/{version}',
    tags: ['AppVersion'],
    summary: 'Deletes an application version',
    operationId: 'deleteAppVersion',
    security: [{ [jwtAuth.name]: [] }],
    request: {
      params: z.object({
        appId: appIdParam,
        version: appVersionParam,
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

  // POST /app/{appId}/version/{version}/undelete - Undelete an application version and its AppVersionTools
  registry.registerPath({
    method: 'post',
    path: '/app/{appId}/version/{version}/undelete',
    tags: ['AppVersion'],
    summary: 'Undeletes an application version',
    operationId: 'undeleteAppVersion',
    security: [{ [jwtAuth.name]: [] }],
    request: {
      params: z.object({
        appId: appIdParam,
        version: appVersionParam,
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

  // DELETE /app/{appId}/version/{appVersion}/tool/{toolPackageName} - Delete a tool for an application version
  registry.registerPath({
    method: 'delete',
    path: '/app/{appId}/version/{appVersion}/tool/{toolPackageName}',
    tags: ['AppVersionTool'],
    summary: 'Deletes a tool for an application version',
    operationId: 'deleteAppVersionTool',
    security: [{ [jwtAuth.name]: [] }],
    request: {
      params: z.object({
        appId: appIdParam,
        appVersion: appVersionParam,
        toolPackageName: packageNameParam,
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
        description: 'Application, version, or tool not found',
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

  // POST /app/{appId}/version/{appVersion}/tool/{toolPackageName}/undelete - Undelete a tool for an application version
  registry.registerPath({
    method: 'post',
    path: '/app/{appId}/version/{appVersion}/tool/{toolPackageName}/undelete',
    tags: ['AppVersionTool'],
    summary: 'Undeletes a tool for an application version',
    operationId: 'undeleteAppVersionTool',
    security: [{ [jwtAuth.name]: [] }],
    request: {
      params: z.object({
        appId: appIdParam,
        appVersion: appVersionParam,
        toolPackageName: packageNameParam,
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
        description: 'Application, version, or tool not found',
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
    security: [{ [jwtAuth.name]: [] }],
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
}
