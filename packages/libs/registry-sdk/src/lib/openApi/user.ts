import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import { getAgentFundsRequest, getAgentFundsResponse } from '../schemas/agentFunds';
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
import {
  uninstallAppRequest,
  uninstallAppResponse,
  completeUninstallRequest,
  completeUninstallResponse,
} from '../schemas/uninstallApp';
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

  // Uninstall schemas
  const UninstallAppRequest = registry.register('UninstallAppRequest', uninstallAppRequest);
  const UninstallAppResponse = registry.register('UninstallAppResponse', uninstallAppResponse);
  const CompleteUninstallRequest = registry.register(
    'CompleteUninstallRequest',
    completeUninstallRequest,
  );
  const CompleteUninstallResponse = registry.register(
    'CompleteUninstallResponse',
    completeUninstallResponse,
  );

  // Agent funds schemas
  const GetAgentFundsRequest = registry.register('GetAgentFundsRequest', getAgentFundsRequest);
  const GetAgentFundsResponse = registry.register('GetAgentFundsResponse', getAgentFundsResponse);

  // POST /user/:appId/install-app - Install an app for a user
  registry.registerPath({
    method: 'post',
    path: '/user/{appId}/install-app',
    tags: ['User'],
    summary: 'Install an application for a user',
    description:
      'Installs an app for a user. If the user has never installed the app, mints a PKP and permits the app. If the user previously uninstalled the app, re-enables it.',
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

  // POST /user/:appId/uninstall-app - Uninstall an app for a user
  registry.registerPath({
    method: 'post',
    path: '/user/{appId}/uninstall-app',
    tags: ['User'],
    summary: 'Uninstall an application for a user',
    description:
      'Generates EIP2771 data to sign for revoking permission for an agent to use a specific app version',
    operationId: 'uninstallApp',
    request: {
      params: z.object({ appId: appIdParam }),
      body: {
        content: {
          'application/json': {
            schema: UninstallAppRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Uninstall data returned successfully',
        content: {
          'application/json': {
            schema: UninstallAppResponse,
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

  // POST /user/:appId/complete-uninstall - Complete app uninstall with signed data
  registry.registerPath({
    method: 'post',
    path: '/user/{appId}/complete-uninstall',
    tags: ['User'],
    summary: 'Complete app uninstall',
    description: 'Submits the signed EIP2771 data to Gelato relay to complete the uninstall',
    operationId: 'completeUninstall',
    request: {
      params: z.object({ appId: appIdParam }),
      body: {
        content: {
          'application/json': {
            schema: CompleteUninstallRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Uninstall completed successfully',
        content: {
          'application/json': {
            schema: CompleteUninstallResponse,
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

  // POST /user/:appId/agent-funds - Get token balances for an agent's smart account
  registry.registerPath({
    method: 'post',
    path: '/user/{appId}/agent-funds',
    tags: ['User'],
    summary: 'Get agent funds',
    description:
      'Returns the token balances held by the agent smart account for a user and app combination',
    operationId: 'getAgentFunds',
    request: {
      params: z.object({ appId: appIdParam }),
      body: {
        content: {
          'application/json': {
            schema: GetAgentFundsRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Agent funds returned successfully',
        content: {
          'application/json': {
            schema: GetAgentFundsResponse,
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
