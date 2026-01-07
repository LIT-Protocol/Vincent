import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import {
  completeInstallationRequest,
  completeInstallationResponse,
} from '../schemas/completeInstallation';
import {
  getAgentAccountRequest,
  getAgentAccountResponse,
  installAppRequest,
  installAppResponse,
} from '../schemas/installedApp';
import { z } from '../schemas/openApiZod';
import { appIdParam } from './app';
import { ErrorResponse } from './baseRegistry';

export function addToRegistry(registry: OpenAPIRegistry) {
  const InstallAppRequest = registry.register('InstallAppRequest', installAppRequest);
  const InstallAppResponse = registry.register('InstallAppResponse', installAppResponse);
  const CompleteInstallationRequest = registry.register(
    'CompleteInstallationRequest',
    completeInstallationRequest,
  );
  const CompleteInstallationResponse = registry.register(
    'CompleteInstallationResponse',
    completeInstallationResponse,
  );
  const GetAgentAccountRequest = registry.register(
    'GetAgentAccountRequest',
    getAgentAccountRequest,
  );
  const GetAgentAccountResponse = registry.register(
    'GetAgentAccountResponse',
    getAgentAccountResponse,
  );

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

  // POST /user/:appId/complete-installation - Complete app installation with signed data
  registry.registerPath({
    method: 'post',
    path: '/user/{appId}/complete-installation',
    tags: ['User'],
    summary: 'Complete app installation',
    description: 'Submits the signed EIP2771 data to Gelato relay to complete the installation',
    operationId: 'completeInstallation',
    // Removed JWT Auth
    request: {
      params: z.object({ appId: appIdParam }),
      body: {
        content: {
          'application/json': {
            schema: CompleteInstallationRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Installation completed successfully',
        content: {
          'application/json': {
            schema: CompleteInstallationResponse,
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

  // POST /user/:appId/agent-account - Get agent account for a user and app
  registry.registerPath({
    method: 'post',
    path: '/user/{appId}/agent-account',
    tags: ['User'],
    summary: 'Get agent account address',
    description:
      'Derives and verifies the agent smart account address for a user and app combination',
    operationId: 'getAgentAccount',
    request: {
      params: z.object({ appId: appIdParam }),
      body: {
        content: {
          'application/json': {
            schema: GetAgentAccountRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Agent account address returned successfully',
        content: {
          'application/json': {
            schema: GetAgentAccountResponse,
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
