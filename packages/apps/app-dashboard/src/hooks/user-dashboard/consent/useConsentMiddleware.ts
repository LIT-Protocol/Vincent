import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import {
  getAllPermittedAppIdsForPkp,
  getPermittedAppVersionForPkp,
  getAppVersion,
} from '@lit-protocol/vincent-contracts-sdk';
import { useEffect, useState } from 'react';
import { App } from '@/types/developer-dashboard/appTypes';

export type UseConsentMiddlewareProps = {
  appId: number;
  pkpEthAddress: string;
  appData: App;
};

export type UseConsentMiddlewareReturn = {
  isPermitted: boolean | null;
  appExists: boolean | null;
  activeVersionExists: boolean | null;
  userPermittedVersion: number | null;
  isLoading: boolean;
  error: string | null;
};

export const useConsentMiddleware = ({
  appId,
  pkpEthAddress,
  appData,
}: UseConsentMiddlewareProps): UseConsentMiddlewareReturn => {
  const [state, setState] = useState<UseConsentMiddlewareReturn>({
    isPermitted: null,
    appExists: null,
    activeVersionExists: null,
    userPermittedVersion: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Early return if params are missing
    if (!appId || !pkpEthAddress) {
      setState({
        isPermitted: null,
        appExists: null,
        activeVersionExists: null,
        userPermittedVersion: null,
        isLoading: false,
        error: 'Missing appId or pkpEthAddress',
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
        const appVersionResult = await getAppVersion({
          signer: readOnlySigner,
          args: { appId, version: appData.activeVersion },
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

        const userApps = await getAllPermittedAppIdsForPkp({
          signer: readOnlySigner,
          args: { pkpEthAddress },
        });

        if (userApps.includes(appId)) {
          const version = await getPermittedAppVersionForPkp({
            signer: readOnlySigner,
            args: { pkpEthAddress, appId },
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
