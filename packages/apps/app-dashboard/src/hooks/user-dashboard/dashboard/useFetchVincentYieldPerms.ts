import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import { useEffect, useState } from 'react';

// 5731522461

type UseFetchUserPermissionsProps = {
  pkpEthAddress: string;
};

type UseFetchUserPermissionsReturn = {
  result: boolean;
  isLoading: boolean;
  error: string | null;
};

const VINCENT_YIELD_APPID = 5731522461;

export function useFetchVincentYieldPerms({
  pkpEthAddress,
}: UseFetchUserPermissionsProps): UseFetchUserPermissionsReturn {
  const [state, setState] = useState<UseFetchUserPermissionsReturn>({
    result: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!pkpEthAddress) {
      setState({
        result: false,
        isLoading: false,
        error: 'PKP address is required',
      });
      return;
    }

    const checkPermissions = async () => {
      try {
        const client = getClient({ signer: readOnlySigner });
        const permittedAppIds = await client.getAllPermittedAppIdsForPkp({
          pkpEthAddress,
        });

        const hasPermission = permittedAppIds.includes(VINCENT_YIELD_APPID);
        setState({
          result: hasPermission,
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        setState({
          result: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        });
      }
    };

    checkPermissions();
  }, [pkpEthAddress]);

  return state;
}
