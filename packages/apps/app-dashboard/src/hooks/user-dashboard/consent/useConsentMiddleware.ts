import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import {
  getAllPermittedAppIdsForPkp,
  getPermittedAppVersionForPkp,
  getAppVersion,
} from '@lit-protocol/vincent-contracts-sdk';
import { useEffect, useState } from 'react';
import { App } from '@/types/developer-dashboard/appTypes';

export type UseConsentMiddlewareProps = {
  appId: string;
  pkpTokenId: string;
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
  pkpTokenId,
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
    if (!appId || !pkpTokenId) {
      setState({
        isPermitted: null,
        appExists: null,
        activeVersionExists: null,
        userPermittedVersion: null,
        isLoading: false,
        error: 'Missing appId or pkpTokenId',
      });
      return;
    }

    const checkPermitted = async () => {
      try {
        // Check if the app's active version is published in the registry (if we have app data)
        if (appData?.activeVersion) {
          const appVersionResult = await getAppVersion({
            signer: readOnlySigner,
            args: { appId: appId.toString(), version: appData.activeVersion.toString() },
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
        }

        const userApps = await getAllPermittedAppIdsForPkp({
          signer: readOnlySigner,
          args: { pkpTokenId },
        });

        if (userApps.includes(appId)) {
          const version = await getPermittedAppVersionForPkp({
            signer: readOnlySigner,
            args: { pkpTokenId, appId },
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
  }, [appId, pkpTokenId, appData]);

  return state;
};
