import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import { installAppRequest, installAppResponse } from '../schemas/installedApp';
import { z } from '../schemas/openApiZod';
import { appIdParam } from './app';
import { ErrorResponse } from './baseRegistry';

export function addToRegistry(registry: OpenAPIRegistry) {
  const InstallAppRequest = registry.register('InstallAppRequest', installAppRequest);
  const InstallAppResponse = registry.register('InstallAppResponse', installAppResponse);

  // POST /user/:appId/install-app - Install an app for a user
  registry.registerPath({
    method: 'post',
    path: '/user/{appId}/install-app',
    tags: ['User'],
    summary: 'Install an application for a user',
    description: 'Mints a PKP with the app abilities as permitted auth methods',
    operationId: 'installApp',
    // Removed JWT Auth
    request: {
      params: z.object({ appId: appIdParam }),
      body: {
        content: {
          'application/json': {
            schema: InstallAppRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'App installation data returned successfully',
        content: {
          'application/json': {
            schema: InstallAppResponse,
          },
        },
      },
      400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
      404: {
        description: 'App not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
      default: {
        description: 'Error',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  });
}
