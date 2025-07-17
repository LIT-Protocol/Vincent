import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import { getAllPermittedAppIdsForPkp } from '@lit-protocol/vincent-contracts-sdk';
import { useEffect, useState } from 'react';

export type UseUserPermissionsMiddlewareProps = {
  pkpTokenId: string;
};

export type UseUserPermissionsMiddlewareReturn = {
  permittedApps: string[];
  isLoading: boolean;
  error: string | null;
};

export const useUserPermissionsMiddleware = ({
  pkpTokenId,
}: UseUserPermissionsMiddlewareProps): UseUserPermissionsMiddlewareReturn => {
  const [state, setState] = useState<UseUserPermissionsMiddlewareReturn>({
    permittedApps: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Early return if params are missing
    if (!pkpTokenId) {
      setState({
        permittedApps: [],
        isLoading: false,
        error: 'Missing pkpTokenId',
      });
      return;
    }

    const checkPermitted = async () => {
      try {
        const userApps = await getAllPermittedAppIdsForPkp({
          signer: readOnlySigner,
          args: { pkpTokenId },
        });

        setState({
          permittedApps: userApps,
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        setState({
          permittedApps: [],
          isLoading: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        });
      }
    };

    checkPermitted();
  }, [pkpTokenId]);

  return state;
};
