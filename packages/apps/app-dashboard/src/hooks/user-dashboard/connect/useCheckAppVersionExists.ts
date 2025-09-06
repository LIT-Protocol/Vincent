import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { useEffect, useState } from 'react';
import { App } from '@/types/developer-dashboard/appTypes';

export type UseCheckAppVersionExistsProps = {
  appId: number;
  pkpEthAddress: string;
  appData: App;
};

export type UseCheckAppVersionExistsReturn = {
  appExists: boolean | null;
  activeVersionExists: boolean | null;
  isLoading: boolean;
  error: string | null;
};

export const useCheckAppVersionExists = ({
  appId,
  pkpEthAddress,
  appData,
}: UseCheckAppVersionExistsProps): UseCheckAppVersionExistsReturn => {
  const [state, setState] = useState<UseCheckAppVersionExistsReturn>({
    appExists: null,
    activeVersionExists: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Early return if appId is missing (this is a real error)
    if (!appId) {
      setState({
        appExists: null,
        activeVersionExists: null,
        isLoading: false,
        error: 'Missing appId',
      });
      return;
    }

    // If pkpEthAddress is missing, stay in loading state (auth might still be loading)
    if (!pkpEthAddress) {
      setState({
        appExists: null,
        activeVersionExists: null,
        isLoading: true,
        error: null,
      });
      return;
    }

    // Wait for appData to be fully loaded before proceeding
    if (!appData) {
      setState({
        appExists: null,
        activeVersionExists: null,
        isLoading: true,
        error: null,
      });
      return;
    }

    const checkPermitted = async () => {
      try {
        // Check if the app has an active version set
        if (!appData.activeVersion) {
          setState({
            appExists: true,
            activeVersionExists: false,
            isLoading: false,
            error: null,
          });
          return;
        }

        // Always check if the app's active version is published in the registry
        const client = getClient({ signer: readOnlySigner });
        const appVersionResult = await client.getAppVersion({
          appId,
          version: appData.activeVersion,
        });

        // If getAppVersion returns null, it means the app version is not registered
        if (appVersionResult === null) {
          setState({
            appExists: true,
            activeVersionExists: false,
            isLoading: false,
            error: null,
          });
          return;
        }

        setState({
          appExists: true,
          activeVersionExists: true,
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        setState({
          appExists: null,
          activeVersionExists: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        });
      }
    };

    checkPermitted();
  }, [appId, pkpEthAddress, appData]);

  return state;
};
