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
import {
  repermitAppRequest,
  repermitAppResponse,
  completeRepermitRequest,
  completeRepermitResponse,
} from '../schemas/repermitApp';
import {
  unpermitAppRequest,
  unpermitAppResponse,
  completeUnpermitRequest,
  completeUnpermitResponse,
} from '../schemas/unpermitApp';
import { z } from '../schemas/openApiZod';
import { appIdParam } from './app';
import { ErrorResponse } from './baseRegistry';

export function addToRegistry(registry: OpenAPIRegistry) {
  // Permit schemas
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

  // Unpermit schemas
  const UnpermitAppRequest = registry.register('UnpermitAppRequest', unpermitAppRequest);
  const UnpermitAppResponse = registry.register('UnpermitAppResponse', unpermitAppResponse);
  const CompleteUnpermitRequest = registry.register(
    'CompleteUnpermitRequest',
    completeUnpermitRequest,
  );
  const CompleteUnpermitResponse = registry.register(
    'CompleteUnpermitResponse',
    completeUnpermitResponse,
  );

  // Repermit schemas
  const RepermitAppRequest = registry.register('RepermitAppRequest', repermitAppRequest);
  const RepermitAppResponse = registry.register('RepermitAppResponse', repermitAppResponse);
  const CompleteRepermitRequest = registry.register(
    'CompleteRepermitRequest',
    completeRepermitRequest,
  );
  const CompleteRepermitResponse = registry.register(
    'CompleteRepermitResponse',
    completeRepermitResponse,
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

  // POST /user/:appId/unpermit-app - Unpermit an app for a user
  registry.registerPath({
    method: 'post',
    path: '/user/{appId}/unpermit-app',
    tags: ['User'],
    summary: 'Unpermit an application for a user',
    description:
      'Generates EIP2771 data to sign for revoking permission for an agent to use a specific app version',
    operationId: 'unpermitApp',
    request: {
      params: z.object({ appId: appIdParam }),
      body: {
        content: {
          'application/json': {
            schema: UnpermitAppRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Unpermit data returned successfully',
        content: {
          'application/json': {
            schema: UnpermitAppResponse,
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

  // POST /user/:appId/complete-unpermit - Complete app unpermit with signed data
  registry.registerPath({
    method: 'post',
    path: '/user/{appId}/complete-unpermit',
    tags: ['User'],
    summary: 'Complete app unpermit',
    description: 'Submits the signed EIP2771 data to Gelato relay to complete the unpermit',
    operationId: 'completeUnpermit',
    request: {
      params: z.object({ appId: appIdParam }),
      body: {
        content: {
          'application/json': {
            schema: CompleteUnpermitRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Unpermit completed successfully',
        content: {
          'application/json': {
            schema: CompleteUnpermitResponse,
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

  // POST /user/:appId/repermit-app - Repermit a previously unpermitted app for a user
  registry.registerPath({
    method: 'post',
    path: '/user/{appId}/repermit-app',
    tags: ['User'],
    summary: 'Repermit an application for a user',
    description:
      'Generates EIP2771 data to sign for re-authorizing a previously unpermitted app with its last permitted version',
    operationId: 'repermitApp',
    request: {
      params: z.object({ appId: appIdParam }),
      body: {
        content: {
          'application/json': {
            schema: RepermitAppRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Repermit data returned successfully',
        content: {
          'application/json': {
            schema: RepermitAppResponse,
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

  // POST /user/:appId/complete-repermit - Complete app repermit with signed data
  registry.registerPath({
    method: 'post',
    path: '/user/{appId}/complete-repermit',
    tags: ['User'],
    summary: 'Complete app repermit',
    description: 'Submits the signed EIP2771 data to Gelato relay to complete the repermit',
    operationId: 'completeRepermit',
    request: {
      params: z.object({ appId: appIdParam }),
      body: {
        content: {
          'application/json': {
            schema: CompleteRepermitRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Repermit completed successfully',
        content: {
          'application/json': {
            schema: CompleteRepermitResponse,
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
