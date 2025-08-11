import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { useEffect, useState } from 'react';
import { AgentPKPMap } from '@/utils/user-dashboard/getAgentPKP';

export type UseUserPermissionsMiddlewareProps = {
  agentPKPs: AgentPKPMap;
};

export type UseUserPermissionsMiddlewareReturn = {
  permittedApps: number[] | null;
  permittedAppVersions: Record<string, string>;
  isLoading: boolean;
  error: string | null;
};

export const useUserPermissionsMiddleware = ({
  agentPKPs,
}: UseUserPermissionsMiddlewareProps): UseUserPermissionsMiddlewareReturn => {
  const [state, setState] = useState<UseUserPermissionsMiddlewareReturn>({
    permittedApps: null,
    permittedAppVersions: {},
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Early return if no agent PKPs available
    if (!agentPKPs || !Object.keys(agentPKPs).length) {
      setState({
        permittedApps: [],
        permittedAppVersions: {},
        isLoading: false,
        error: null,
      });
      return;
    }

    const checkPermitted = async () => {
      try {
        const client = getClient({ signer: readOnlySigner });

        // Get app IDs directly from agentPKPs keys (since it's a 1-to-1 mapping)
        const permittedAppIds = Object.keys(agentPKPs || {}).map(Number);

        // Get app versions for each agent PKP/app pair
        const appVersionPromises = Object.entries(agentPKPs || {}).map(async ([appId, pkp]) => {
          const version = await client.getPermittedAppVersionForPkp({
            pkpEthAddress: pkp.ethAddress,
            appId: Number(appId),
          });
          return { appId, version };
        });

        const appVersionResults = await Promise.all(appVersionPromises);

        // Create a record mapping app ID to version
        const permittedAppVersions = appVersionResults.reduce(
          (acc, { appId, version }) => {
            acc[appId.toString()] = version?.toString() ?? '';
            return acc;
          },
          {} as Record<string, string>,
        );

        setState({
          permittedApps: permittedAppIds,
          permittedAppVersions,
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        setState({
          permittedApps: null,
          permittedAppVersions: {},
          isLoading: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        });
      }
    };

    checkPermitted();
  }, [agentPKPs]);

  return state;
};
