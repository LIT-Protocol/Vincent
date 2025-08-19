import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { useEffect, useState } from 'react';
import { App } from '@/types/developer-dashboard/appTypes';

export type UseConnectMiddlewareProps = {
  appId: number;
  pkpEthAddress: string;
  appData: App;
};

export type UseConnectMiddlewareReturn = {
  isPermitted: boolean | null;
  appExists: boolean | null;
  activeVersionExists: boolean | null;
  userPermittedVersion: number | null;
  isLoading: boolean;
  error: string | null;
};

export const useConnectMiddleware = ({
  appId,
  pkpEthAddress,
  appData,
}: UseConnectMiddlewareProps): UseConnectMiddlewareReturn => {
  const [state, setState] = useState<UseConnectMiddlewareReturn>({
    isPermitted: null,
    appExists: null,
    activeVersionExists: null,
    userPermittedVersion: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Early return if appId is missing (this is a real error)
    if (!appId) {
      setState({
        isPermitted: null,
        appExists: null,
        activeVersionExists: null,
        userPermittedVersion: null,
        isLoading: false,
        error: 'Missing appId',
      });
      return;
    }

    // If pkpEthAddress is missing, stay in loading state (auth might still be loading)
    if (!pkpEthAddress) {
      setState({
        isPermitted: null,
        appExists: null,
        activeVersionExists: null,
        userPermittedVersion: null,
        isLoading: true,
        error: null,
      });
      return;
    }

    // Wait for appData to be fully loaded before proceeding
    if (!appData) {
      setState({
        isPermitted: null,
        appExists: null,
        activeVersionExists: null,
        userPermittedVersion: null,
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
            isPermitted: null,
            appExists: true,
            activeVersionExists: false,
            userPermittedVersion: null,
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
            isPermitted: null,
            appExists: true,
            activeVersionExists: false,
            userPermittedVersion: null,
            isLoading: false,
            error: null,
          });
          return;
        }

        const userApps = await client.getAllPermittedAppIdsForPkp({
          pkpEthAddress,
          offset: '0', // TODO: Make this configurable?
        });

        if (userApps.includes(appId)) {
          const version = await client.getPermittedAppVersionForPkp({
            pkpEthAddress,
            appId,
          });

          setState({
            isPermitted: true,
            appExists: true,
            activeVersionExists: true,
            userPermittedVersion: Number(version),
            isLoading: false,
            error: null,
          });
        } else {
          setState({
            isPermitted: false,
            appExists: true,
            activeVersionExists: true,
            userPermittedVersion: null,
            isLoading: false,
            error: null,
          });
        }
      } catch (error: any) {
        setState({
          isPermitted: null,
          appExists: null,
          activeVersionExists: null,
          userPermittedVersion: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        });
      }
    };

    checkPermitted();
  }, [appId, pkpEthAddress, appData]);

  return state;
};
