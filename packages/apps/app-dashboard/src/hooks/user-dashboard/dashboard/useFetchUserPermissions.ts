import { getClient, PermissionData } from '@lit-protocol/vincent-contracts-sdk';

import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import { useEffect, useState } from 'react';

export type UseFetchUserPermissionsProps = {
  appId: number;
  pkpEthAddress: string;
};

export type UseFetchUserPermissionsReturn = {
  existingData: PermissionData;
  isLoading: boolean;
  error: string | null;
};

export const useFetchUserPermissions = ({
  appId,
  pkpEthAddress,
}: UseFetchUserPermissionsProps): UseFetchUserPermissionsReturn => {
  const [state, setState] = useState<UseFetchUserPermissionsReturn>({
    existingData: {} as PermissionData,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Early return if params are missing
    if (!pkpEthAddress || !appId) {
      setState({
        existingData: {} as PermissionData,
        isLoading: false,
        error: 'Missing necessary parameters to fetch user permissions',
      });
      return;
    }

    const checkPermitted = async () => {
      try {
        const client = getClient({ signer: readOnlySigner });
        const existingData = await client.getAllToolsAndPoliciesForApp({
          pkpEthAddress,
          appId,
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
  }, [pkpEthAddress, appId]);

  return state;
};
