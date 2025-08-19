import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { useEffect, useState } from 'react';
import { IRelayPKP } from '@lit-protocol/types';

export type UseUserPermissionsForAppsProps = {
  agentPKPs: IRelayPKP[];
};

export type UseUserPermissionsForAppsReturn = {
  permittedApps: number[] | null;
  permittedAppVersions: Record<string, string>;
  isLoading: boolean;
  error: string | null;
};

export const useUserPermissionsForApps = ({
  agentPKPs,
}: UseUserPermissionsForAppsProps): UseUserPermissionsForAppsReturn => {
  const [state, setState] = useState<UseUserPermissionsForAppsReturn>({
    permittedApps: null,
    permittedAppVersions: {},
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Early return if params are missing
    if (!agentPKPs || !agentPKPs.length) {
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

        // Since each PKP has 1-to-1 mapping with an app, fetch app and version for each PKP
        const results = await Promise.all(
          agentPKPs.map(async (pkp) => {
            const userApps = await client.getAllPermittedAppIdsForPkp({
              pkpEthAddress: pkp.ethAddress,
              offset: '0',
            });

            // Should only be one app per PKP, but handle the array safely
            const appId = userApps[0];
            if (!appId) return null;

            const version = await client.getPermittedAppVersionForPkp({
              pkpEthAddress: pkp.ethAddress,
              appId,
            });

            return { appId, version };
          }),
        );

        // Filter out null results and extract data
        const validResults = results.filter(
          (result): result is { appId: number; version: number | null } => result !== null,
        );
        const allPermittedApps = validResults.map((result) => result.appId);
        const allAppVersions: Record<string, string> = {};

        validResults.forEach(({ appId, version }) => {
          allAppVersions[appId.toString()] = version?.toString() ?? '';
        });

        setState({
          permittedApps: allPermittedApps,
          permittedAppVersions: allAppVersions,
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
  }, [agentPKPs.map((pkp) => pkp.ethAddress).join(',')]);

  return state;
};
