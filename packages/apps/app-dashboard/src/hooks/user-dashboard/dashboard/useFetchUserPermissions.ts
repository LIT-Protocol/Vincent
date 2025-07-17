import { getAllToolsAndPoliciesForApp, PermissionData } from '@lit-protocol/vincent-contracts-sdk';

import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import { useEffect, useState } from 'react';

export type UseFetchUserPermissionsProps = {
  appId: string;
  pkpTokenId: string;
};

export type UseFetchUserPermissionsReturn = {
  existingData: PermissionData;
  isLoading: boolean;
  error: string | null;
};

export const useFetchUserPermissions = ({
  appId,
  pkpTokenId,
}: UseFetchUserPermissionsProps): UseFetchUserPermissionsReturn => {
  const [state, setState] = useState<UseFetchUserPermissionsReturn>({
    existingData: {} as PermissionData,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Early return if params are missing
    if (!pkpTokenId || !appId) {
      setState({
        existingData: {} as PermissionData,
        isLoading: false,
        error: 'Missing necessary parameters to fetch user permissions',
      });
      return;
    }

    const checkPermitted = async () => {
      try {
        const existingData = await getAllToolsAndPoliciesForApp({
          signer: readOnlySigner,
          args: {
            pkpTokenId,
            appId: appId.toString(),
          },
        });

        setState({
          existingData,
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        setState({
          existingData: {} as PermissionData,
          isLoading: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        });
      }
    };

    checkPermitted();
  }, [pkpTokenId]);

  return state;
};
