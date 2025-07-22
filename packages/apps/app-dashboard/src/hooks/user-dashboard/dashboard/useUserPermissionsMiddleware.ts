import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import {
  getAllPermittedAppIdsForPkp,
  getPermittedAppVersionForPkp,
} from '@lit-protocol/vincent-contracts-sdk';
import { useEffect, useState } from 'react';

export type UseUserPermissionsMiddlewareProps = {
  pkpEthAddress: string;
};

export type UseUserPermissionsMiddlewareReturn = {
  permittedApps: number[] | null;
  permittedAppVersions: Record<string, string>;
  isLoading: boolean;
  error: string | null;
};

export const useUserPermissionsMiddleware = ({
  pkpEthAddress,
}: UseUserPermissionsMiddlewareProps): UseUserPermissionsMiddlewareReturn => {
  const [state, setState] = useState<UseUserPermissionsMiddlewareReturn>({
    permittedApps: null,
    permittedAppVersions: {},
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Early return if params are missing
    if (!pkpEthAddress) {
      setState({
        permittedApps: null,
        permittedAppVersions: {},
        isLoading: false,
        error: 'Missing pkpEthAddress',
      });
      return;
    }

    const checkPermitted = async () => {
      try {
        const userApps = await getAllPermittedAppIdsForPkp({
          signer: readOnlySigner,
          args: { pkpEthAddress },
        });

        // Get app versions for each permitted app
        const appVersionPromises = userApps.map(async (appId) => {
          const version = await getPermittedAppVersionForPkp({
            signer: readOnlySigner,
            args: { pkpEthAddress, appId },
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
          permittedApps: userApps,
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
  }, [pkpEthAddress]);

  return state;
};
