import { useCallback } from 'react';
import { AppView, ContractVersionResult, VersionParameter } from '@/types';
import { NavigateFunction } from 'react-router-dom';
import { areParametersEqual } from '@/utils/user-dashboard/parameterComparison';
import { IRelayPKP } from '@lit-protocol/types';
import { StatusType } from '@/types/shared/StatusType';

interface AppContext {
  appInfo: AppView | null;
  appId: string | null;
  permittedVersion: number | null;
  versionInfo: ContractVersionResult | null;
  isAppVersionDisabled?: boolean;
  useCurrentVersionOnly: boolean;
}

interface UserContext {
  agentPKP: IRelayPKP;
}

interface UIContext {
  setSubmitting: (submitting: boolean) => void;
  showStatus: (message: string, type?: StatusType) => void;
  showErrorWithStatus: (message: string, type?: string, details?: string) => void;
  updateState: (state: Partial<Record<string, unknown>>) => void;
}

interface ParameterContext {
  existingParameters: VersionParameter[];
  setParameters: (parameters: VersionParameter[]) => void;
  fetchExistingParameters: () => Promise<void>;
}

interface ActionContext {
  updateParameters: () => Promise<Record<string, unknown>>;
  approveConsent: () => Promise<Record<string, unknown>>;
  fetchVersionInfo: (version: number) => Promise<ContractVersionResult>;
  existingParameters?: VersionParameter[];
  parameters?: VersionParameter[];
}

interface RedirectContext {
  redirectUri: string | null;
  generateJWT: (appId: string, appVersion: number, appInfo: AppView) => Promise<string | null>;
  redirectWithJWT: (jwt: string) => void;
  navigate: NavigateFunction;
}

/**
 * Handles parameter changes from the form
 */
export const useParameterHandler = (parameters: ParameterContext) => {
  const { setParameters } = parameters;

  const handleParametersChange = useCallback(
    (newParameters: VersionParameter[]) => {
      const validatedParameters = newParameters.map((param) => ({
        ...param,
        value: param.value === undefined ? '' : param.value,
      }));

      setParameters(validatedParameters);
    },
    [setParameters],
  );

  return { handleParametersChange };
};

/**
 * Handles parameter updates for apps with existing permissions
 */
export const useUpdateParametersHandler = ({
  app,
  ui,
  parameters: parameterContext,
  actions,
}: {
  app: AppContext;
  ui: UIContext;
  parameters: ParameterContext;
  actions: ActionContext;
}) => {
  const { permittedVersion, appId } = app;
  const { updateState, showErrorWithStatus } = ui;
  const { existingParameters, setParameters, fetchExistingParameters } = parameterContext;
  const { fetchVersionInfo } = actions;

  const handleUpdateParameters = useCallback(() => {
    updateState({
      showUpdateModal: false,
      showingAuthorizedMessage: false,
      showSuccess: false,
      isAppAlreadyPermitted: false,
      showVersionUpgradePrompt: false,
      isLoading: true,
      checkingPermissions: false,
      useCurrentVersionOnly: true,
    });

    const fetchAndPopulateParameters = async () => {
      try {
        if (existingParameters.length === 0) {
          await fetchExistingParameters();
        }

        if (existingParameters.length > 0) {
          setParameters(existingParameters);
        }
      } catch (error) {
        console.error('Error loading existing parameters:', error);
      }
    };

    if (permittedVersion !== null && appId) {
      fetchVersionInfo(permittedVersion)
        .then((_result) => {
          fetchAndPopulateParameters().then(() => {
            updateState({ isLoading: false });
          });
        })
        .catch((error: Error) => {
          console.error('Error fetching permitted version data:', error);
          updateState({ isLoading: false });
          showErrorWithStatus('Failed to load version data', 'error');
        });
    } else {
      fetchAndPopulateParameters().then(() => {
        updateState({ isLoading: false });
      });
    }
  }, [
    existingParameters,
    setParameters,
    updateState,
    permittedVersion,
    appId,
    fetchVersionInfo,
    fetchExistingParameters,
    showErrorWithStatus,
  ]);

  return { handleUpdateParameters };
};

/**
 * Handles the approval process and redirects
 */
export const useApprovalHandler = ({
  app,
  user,
  ui,
  actions,
  redirect,
}: {
  app: AppContext;
  user: UserContext;
  ui: UIContext;
  actions: ActionContext;
  redirect: RedirectContext;
}) => {
  const { appInfo, appId, permittedVersion, isAppVersionDisabled, useCurrentVersionOnly } = app;
  const { agentPKP } = user;
  const { showStatus, showErrorWithStatus, setSubmitting, updateState } = ui;
  const { updateParameters, approveConsent } = actions;
  const { redirectUri, generateJWT, redirectWithJWT } = redirect;

  const handleApprove = useCallback(async () => {
    if (isAppVersionDisabled) {
      showErrorWithStatus(
        'This app version has been disabled and cannot be approved.',
        'error',
        'App Disabled',
      );
      return;
    }

    if (!appInfo) {
      showErrorWithStatus(
        'Missing version data. Please refresh the page and try again.',
        'error',
        'Missing Data',
      );
      return;
    }

    setSubmitting(true);
    showStatus('Processing approval...', 'info');
    try {
      const appVersion = permittedVersion || Number(appInfo.latestVersion);
      if (!agentPKP || !appId || !appVersion) {
        const errorMessage = 'Missing required data. Please try again.';
        showErrorWithStatus(errorMessage, 'error', 'Missing Data');
        return;
      }

      let result;
      if (useCurrentVersionOnly) {
        if (
          actions.existingParameters &&
          actions.parameters &&
          areParametersEqual(actions.existingParameters, actions.parameters)
        ) {
          showStatus('No changes to parameters, skipping update...', 'info');
          result = { success: true };
        } else {
          result = await updateParameters();
        }
      } else {
        result = await approveConsent();
      }

      if (!result || !result.success) {
        showErrorWithStatus('Approval process failed', 'error', 'Approval Failed');
        return;
      }

      if (redirectUri) {
        showStatus('Generating authorization token...', 'info');
        try {
          const jwt = await generateJWT(appId, appVersion, appInfo);
          if (jwt) {
            showStatus('Redirecting to application...', 'success');
            redirectWithJWT(jwt);
          } else {
            showErrorWithStatus('Failed to generate authorization token', 'error');
          }
        } catch (err) {
          console.error('Error generating JWT:', err);
          showErrorWithStatus('Failed to generate authorization token', 'error');
        }
      } else {
        updateState({
          showSuccess: true,
          showingAuthorizedMessage: true,
        });
        showStatus('App successfully authorized', 'success');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      const errorMessage = 'Something went wrong. Please try again.';
      showErrorWithStatus(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [
    isAppVersionDisabled,
    appInfo,
    showStatus,
    showErrorWithStatus,
    permittedVersion,
    agentPKP,
    appId,
    useCurrentVersionOnly,
    updateParameters,
    approveConsent,
    updateState,
    redirectUri,
    generateJWT,
    redirectWithJWT,
    setSubmitting,
    actions.existingParameters,
    actions.parameters,
  ]);

  return { handleApprove };
};

/**
 * Main hook combining all consent handlers
 */
export const useConsentHandlers = ({
  appInfo,
  appId,
  permittedVersion,
  versionInfo,
  agentPKP,
  isAppVersionDisabled,
  useCurrentVersionOnly,
  existingParameters,
  parameters,
  setParameters,
  showStatus,
  showErrorWithStatus,
  updateState,
  setSubmitting,
  updateParameters,
  approveConsent,
  fetchVersionInfo,
  fetchExistingParameters,
  redirectUri,
  generateJWT,
  redirectWithJWT,
  navigate,
}: {
  appInfo: AppView | null;
  appId: string | null;
  permittedVersion: number | null;
  versionInfo: ContractVersionResult | null;
  agentPKP: IRelayPKP;
  isAppVersionDisabled?: boolean;
  useCurrentVersionOnly: boolean;
  existingParameters: VersionParameter[];
  parameters: VersionParameter[];
  setParameters: (parameters: VersionParameter[]) => void;
  showStatus: (message: string, type?: StatusType) => void;
  showErrorWithStatus: (message: string, type?: string, details?: string) => void;
  updateState: (state: Partial<Record<string, unknown>>) => void;
  setSubmitting: (submitting: boolean) => void;
  updateParameters: () => Promise<Record<string, unknown>>;
  approveConsent: () => Promise<Record<string, unknown>>;
  fetchVersionInfo: (version: number) => Promise<ContractVersionResult>;
  fetchExistingParameters: () => Promise<void>;
  redirectUri: string | null;
  generateJWT: (appId: string, appVersion: number, appInfo: AppView) => Promise<string | null>;
  redirectWithJWT: (jwt: string) => void;
  navigate: NavigateFunction;
}) => {
  const app: AppContext = {
    appInfo,
    appId,
    permittedVersion,
    versionInfo,
    isAppVersionDisabled,
    useCurrentVersionOnly,
  };

  const user: UserContext = {
    agentPKP,
  };

  const ui: UIContext = {
    showStatus,
    showErrorWithStatus,
    updateState,
    setSubmitting,
  };

  const parameterContext: ParameterContext = {
    existingParameters,
    setParameters,
    fetchExistingParameters,
  };

  const actions: ActionContext = {
    updateParameters,
    approveConsent,
    fetchVersionInfo,
    existingParameters,
    parameters,
  };

  const redirect: RedirectContext = {
    redirectUri,
    generateJWT,
    redirectWithJWT,
    navigate,
  };

  const { handleParametersChange } = useParameterHandler(parameterContext);

  const { handleUpdateParameters } = useUpdateParametersHandler({
    app,
    ui,
    parameters: parameterContext,
    actions,
  });

  const { handleApprove } = useApprovalHandler({
    app,
    user,
    ui,
    actions,
    redirect,
  });

  return {
    handleApprove,
    handleUpdateParameters,
    handleParametersChange,
  };
};
