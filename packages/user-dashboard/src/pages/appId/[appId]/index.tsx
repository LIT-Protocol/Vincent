import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowUpCircle } from 'lucide-react';
import { useErrorPopup } from '@/providers/ErrorPopup';
import { StatusMessage } from '@/utils/statusMessage';
import { wrap } from '@/utils/components';
import { UserProviders } from '@/providers';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/components/consent/utils/lit';
import { useReadAuthInfo } from '@/components/consent/hooks/useAuthInfo';
import UserLayout from '@/components/layout/UserLayout';
import VersionParametersForm from '@/components/consent/components/authForm/VersionParametersForm';
import { useParameterManagement } from '@/components/consent/hooks/useParameterManagement';
import { AppView } from '@/components/consent/types';
import { getAppViewRegistryContract, getUserRegistryContract, getUserViewRegistryContract } from '@/components/consent/utils/contracts';
import { prepareParameterUpdateData } from '@/components/consent/utils/consentArrayUtils';
import { 
  checkAppPermissionStatus, 
  verifyPermissionGrant 
} from '@/components/consent/utils/consentVerificationUtils';
import { 
  sendTransaction, 
  addPermittedActions 
} from '@/components/consent/utils/consentTransactionUtils';
import { 
  identifyParametersToRemove, 
  prepareParameterRemovalData 
} from '@/components/consent/utils/consentArrayUtils';
import { upgradeAppToLatestVersion } from '@/utils/upgradeUtils';
import { useVersionEnabledCheck } from '@/components/consent/hooks/useVersionEnabledCheck';
import ConsentView from "@/components/consent/pages/index";

// Interface for the app details
interface AppDetailsState {
  id: string;
  name: string;
  description: string;
  deploymentStatus: number;
  isDeleted: boolean;
  manager: string;
  latestVersion: number;
  permittedVersion: number | null;
  authorizedRedirectUris: string[];
  delegatees?: string[]; // Optional property for AppView compatibility
}

function AppDetailsPage() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const { showError } = useErrorPopup();
  const [isLoading, setIsLoading] = useState(true);
  const [app, setApp] = useState<AppDetailsState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  const [authFailed, setAuthFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  // Get authentication info
  const { sessionSigs, authInfo, isProcessing } = useReadAuthInfo();
  
  const versionFetchedRef = useRef(false);
  
  // Add version enabled checks
  const { isVersionEnabled: isCurrentVersionEnabled } = useVersionEnabledCheck({
    versionNumber: app?.permittedVersion || 0,
    specificAppId: appId
  });
  
  const { isVersionEnabled: isLatestVersionEnabled } = useVersionEnabledCheck({
    versionNumber: app?.latestVersion || 0,
    specificAppId: appId
  });
  
  // Get the appropriate notice text based on version status
  const getVersionStatusText = () => {
    if (!app || app.permittedVersion === null) return null;
    
    if (isCurrentVersionEnabled === false && isLatestVersionEnabled === false) {
      return `Both your current version (${app.permittedVersion}) and the latest version have been disabled by the app developer. Please contact the app developer for assistance.`;
    } else if (isLatestVersionEnabled === false) {
      return `The latest version of this application is currently disabled by the developer. You can continue using the current version.`;
    } else if (isCurrentVersionEnabled === false) {
      return `Version ${app.permittedVersion} has been disabled by the app developer. We recommend updating to the latest version.`;
    }
    
    return null;
  };
  
  const versionStatusText = getVersionStatusText();
  const shouldDisableUpgrade = isLatestVersionEnabled === false;
  
  // Function to handle showing status messages
  const showStatus = (message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
  };

  // Create enhanced error function that shows both popup and status error
  const showErrorWithStatus = (errorMessage: string, title?: string, details?: string) => {
    // Show error in popup
    showError(errorMessage, title || 'Error', details);
    // Also show in status message
    showStatus(errorMessage, 'error');
  };
  
  // Initialize parameter management hook
  const {
    parameters,
    existingParameters,
    versionInfo,
    handleParametersChange,
    fetchVersionInfo,
    fetchExistingParameters
  } = useParameterManagement({
    appId: appId || null, 
    agentPKP: authInfo?.agentPKP,
    appInfo: app as unknown as AppView,
    onStatusChange: showStatus
  });
  
  // Use console to debug parameter values when they change
  useEffect(() => {
    if (existingParameters.length > 0) {
      console.log('Existing parameters from contract:', existingParameters);
    }
  }, [existingParameters]);

  useEffect(() => {
    if (parameters.length > 0) {
      console.log('Current form parameters:', parameters);
    }
  }, [parameters]);
  
  // Fetch version and existing parameters when app details are loaded
  useEffect(() => {
    const loadVersionAndParameters = async () => {
      if (!app || !appId || isLoading || !authInfo?.agentPKP || versionFetchedRef.current) return;
      
      try {
        versionFetchedRef.current = true;
        
        // Get the version information based on permitted version or latest version
        const versionToUse = app.permittedVersion !== null ? app.permittedVersion : app.latestVersion;
        
        console.log('Loading version info for version:', versionToUse);
        await fetchVersionInfo(Number(versionToUse));
        
        // Fetch existing parameters
        console.log('Fetching existing parameters...');
        await fetchExistingParameters();
      } catch (error) {
        console.error('Error loading version data or parameters:', error);
        versionFetchedRef.current = false; // Reset so we can try again
        showStatus('Failed to load application data. Please try refreshing the page.', 'error');
      }
    };
    
    loadVersionAndParameters();
  }, [app, appId, authInfo?.agentPKP, isLoading, fetchVersionInfo, fetchExistingParameters]);
  
  // Function to handle upgrading to the latest version
  const handleUpgradeToLatest = async () => {
    if (!appId || !authInfo?.agentPKP || !authInfo?.userPKP || !sessionSigs || !app) {
      showErrorWithStatus('Missing required data for version upgrade');
      return;
    }
    
    setIsUpgrading(true);
    
    try {
      // Use the shared upgrade utility
      await upgradeAppToLatestVersion({
        appId,
        agentPKP: authInfo.agentPKP,
        userPKP: authInfo.userPKP,
        sessionSigs,
        currentVersion: app.permittedVersion,
        latestVersion: app.latestVersion,
        onStatusChange: showStatus,
        onError: showErrorWithStatus
      });
      
      // Update app state with new permitted version
      setApp(prev => {
        if (!prev) return null;
        return {
          ...prev,
          permittedVersion: prev.latestVersion
        };
      });
      
      // Refresh version info
      versionFetchedRef.current = false;
      
      // Reset parameters and fetch new version info
      try {
        await fetchVersionInfo(Number(app.latestVersion));
        await fetchExistingParameters();
        showStatus('Successfully upgraded to latest version', 'success');
      } catch (refreshError) {
        console.error('Error refreshing version info after upgrade:', refreshError);
        showErrorWithStatus('Upgrade successful, but failed to load latest parameters', 'Refresh Error');
      }
      
    } catch (error) {
      console.error('Version upgrade failed:', error);
      showErrorWithStatus('Failed to upgrade to latest version', 'Upgrade Error');
    } finally {
      setIsUpgrading(false);
    }
  };
  
  useEffect(() => {
    if (!appId) {
      navigate('/');
      return;
    }
    
    // Only fetch app details after auth processing is complete
    if (!isProcessing) {
      fetchAppDetails();
    }
  }, [appId, isProcessing]);
  
  // Fetch app details
  const fetchAppDetails = async () => {
    setIsLoading(true);
    
    if (!sessionSigs || !authInfo?.agentPKP) {
      showErrorWithStatus('Authentication required. Please sign in again.');
      setIsLoading(false);
      setAuthFailed(true);
      return;
    }
    
    try {
      // Get app details from the registry contract
      const appViewContract = getAppViewRegistryContract();
      
      // Helper function to convert BigNumber to simple value
      const convertBigNumber = (value: any): any => {
        if (typeof value === 'object' && value && value._isBigNumber) {
          return value.toString();
        }
        return value;
      };
      
      // Get app details
      const appInfo = await appViewContract.getAppById(parseInt(appId as string));
      console.log('App details:', appInfo);
      
      // Get permitted version for this PKP
      const userViewContract = getUserViewRegistryContract();
      const permittedVersion = await userViewContract.getPermittedAppVersionForPkp(
        authInfo.agentPKP.tokenId,
        parseInt(appId as string)
      );
      console.log('Permitted version:', permittedVersion);
      
      // Create app details object
      const appDetails: AppDetailsState = {
        id: appId as string,
        name: convertBigNumber(appInfo.name) || 'Unnamed App',
        description: convertBigNumber(appInfo.description) || '',
        deploymentStatus: typeof appInfo.deploymentStatus === 'object' && appInfo.deploymentStatus._isBigNumber ? 
          parseInt(appInfo.deploymentStatus.toString()) : 
          appInfo.deploymentStatus,
        isDeleted: appInfo.isDeleted,
        manager: convertBigNumber(appInfo.manager) || '',
        latestVersion: convertBigNumber(appInfo.latestVersion) || 0,
        permittedVersion: permittedVersion ? 
          (typeof permittedVersion === 'object' && permittedVersion._isBigNumber) ? 
            parseInt(permittedVersion.toString()) : 
            permittedVersion 
          : null,
        authorizedRedirectUris: appInfo.authorizedRedirectUris || []
      };
      
      // Get app version data
      try {
        // Immediately set the app state
        setApp(appDetails);
        
        // The version fetching will happen in the useEffect hook
      } catch (error) {
        console.error('Error setting app details:', error);
        showErrorWithStatus('Failed to set app details', 'Application Error');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching app details:', error);
      if (error instanceof Error) {
        showErrorWithStatus(error.message, 'Application Error');
      } else {
        showErrorWithStatus('Failed to load application details', 'Application Error');
      }
      setIsLoading(false);
    }
  };
  
  // Handle form submission (approve)
  const handleApprove = async () => {
    if (!appId || !authInfo?.agentPKP || !authInfo?.userPKP || !sessionSigs || !versionInfo) {
      showErrorWithStatus('Missing required data for parameter update');
      return { success: false, message: 'Missing required data for parameter update' };
    }
    
    setIsSaving(true);
    showStatus('Preparing to update parameters...', 'info');
    
    try {
      // Initialize wallet
      showStatus('Initializing your PKP wallet...', 'info');
      const userPkpWallet = new PKPEthersWallet({
        controllerSessionSigs: sessionSigs,
        pkpPubKey: authInfo.userPKP.publicKey,
        litNodeClient: litNodeClient,
      });
      
      await userPkpWallet.init();
      
      // Connect wallet to the user registry contract
      const userRegistryContract = getUserRegistryContract();
      const connectedContract = userRegistryContract.connect(userPkpWallet);
      
      // Get permitted version
      const { permittedVersion } = await checkAppPermissionStatus(
        authInfo.agentPKP.tokenId,
        appId,
        showStatus
      );
      
      if (!permittedVersion) {
        showErrorWithStatus('You do not have permission to update parameters for this app.');
        setIsSaving(false);
        return { success: false, message: 'No permitted version found' };
      }
      
      // Verify that the permission grant is valid
      const verifiedVersion = await verifyPermissionGrant(
        authInfo.agentPKP.tokenId,
        appId,
        permittedVersion,
        showStatus
      );
      
      if (verifiedVersion === null) {
        showErrorWithStatus('Failed to verify permission grant.');
        setIsSaving(false);
        return { success: false, message: 'Permission verification failed' };
      }
      
      // Get existing parameters
      const existingParameters: Array<{
        toolIndex: number;
        policyIndex: number;
        paramIndex: number;
        name: string;
        type: number;
        value: any;
      }> = [];
      try {
        const userViewContract = getUserViewRegistryContract();
        const appIdNum = Number(appId);
        
        const toolsAndPolicies = await userViewContract.getAllToolsAndPoliciesForApp(
          authInfo.agentPKP.tokenId,
          appIdNum
        );
        
        toolsAndPolicies.forEach((tool: any, toolIndex: number) => {
          tool.policies.forEach((policy: any, policyIndex: number) => {
            policy.parameters.forEach((param: any, paramIndex: number) => {
              existingParameters.push({
                toolIndex,
                policyIndex,
                paramIndex,
                name: param.name,
                type: param.paramType,
                value: param.value,
              });
            });
          });
        });
      } catch (error) {
        console.error('Error fetching existing parameters:', error);
        showStatus('Error fetching existing parameters', 'error');
        setIsSaving(false);
        return { success: false, message: 'Error fetching existing parameters' };
      }
      
      // Handle parameter removal
      const parametersToRemove = identifyParametersToRemove(existingParameters, parameters);
      
      if (parametersToRemove.length > 0) {
        showStatus('Removing cleared parameters...', 'info');
        
        const { filteredTools, filteredPolicies, filteredParams } =
          prepareParameterRemovalData(parametersToRemove, versionInfo);
        try {
          const removeArgs = [
            appId,
            authInfo.agentPKP.tokenId,
            permittedVersion,
            filteredTools,
            filteredPolicies,
            filteredParams,
          ];
          
          const removeTxResponse = await sendTransaction(
            connectedContract,
            'removeToolPolicyParameters',
            removeArgs,
            'Sending transaction to remove cleared parameters...',
            showStatus,
            showErrorWithStatus
          );
          
          showStatus('Waiting for removal transaction to be confirmed...', 'info');
          await removeTxResponse.wait(1);
          showStatus('Parameter removal transaction confirmed!', 'success');
        } catch (error) {
          console.error('Parameter removal failed:', error);
          showStatus('Failed to remove cleared parameters', 'warning');
          // Continue anyway, as we might still be able to update other parameters
        }
      }
      
      // Prepare parameter data
      showStatus('Preparing parameter data for contract...', 'info');
      const {
        toolIpfsCids,
        policyIpfsCids,
        policyParameterNames,
        policyParameterValues,
        hasParametersToSet
      } = prepareParameterUpdateData(parameters, versionInfo);
      
      console.log("Parameters to update:", {
        toolIpfsCids,
        policyIpfsCids,
        policyParameterNames,
        policyParameterValues
      });
      
      // Add permitted actions before setting parameters
      if (toolIpfsCids.length > 0 || policyIpfsCids.length > 0) {
        showStatus('Adding permitted actions...', 'info');
        try {
          const approvalResult = await addPermittedActions(
            userPkpWallet,
            authInfo.agentPKP.tokenId,
            toolIpfsCids,
            policyIpfsCids.flat(),
            showStatus
          );
          
          if (!approvalResult.success) {
            console.error('Failed to add permitted actions:', approvalResult.error);
            showStatus('Failed to add permitted actions', 'warning');
            // Continue anyway as we might still be able to update parameters
          }
        } catch (error) {
          console.error('Failed to add permitted actions:', error);
          showStatus('Failed to add permitted actions', 'warning');
          // Continue anyway as we might still be able to update parameters
        }
      }
      
      if (!hasParametersToSet) {
        showStatus('No parameters to update', 'success');
        setIsSaving(false);
        return { success: true };
      }
      
      const updateArgs = [
        authInfo.agentPKP.tokenId,
        appId,
        permittedVersion,
        toolIpfsCids,
        policyIpfsCids,
        policyParameterNames,
        policyParameterValues,
      ];
      
      console.log("Sending update with args:", updateArgs);
      
      const txResponse = await sendTransaction(
        connectedContract,
        'setToolPolicyParameters',
        updateArgs,
        'Sending transaction to update parameters...',
        showStatus,
        showErrorWithStatus
      );
      
      showStatus('Waiting for update transaction to be confirmed...', 'info');
      await txResponse.wait(1);
      console.log('txResponse:', txResponse);
      showStatus('Parameter update transaction confirmed!', 'success');
      
      // Refresh parameters after successful update
      try {
        await fetchExistingParameters();
      } catch (refreshError) {
        console.error('Error refreshing parameters after update:', refreshError);
        // Don't throw here as the update was successful
      }
      
      setIsSaving(false);
      return { success: true };
    } catch (error) {
      console.error('PARAMETER UPDATE PROCESS FAILED:', error);
      showStatus('Parameter update process failed', 'error');
      setIsSaving(false);
      return { success: false, message: 'Parameter update process failed' };
    }
  };
  
  // Handle back button
  const handleBack = () => {
    navigate('/');
  };
  
  // Deployment status names for display
  const deploymentStatusNames = ['DEV', 'TEST', 'PROD'];
  
  // If auth failed, show a better UI
  if (authFailed) {
    return (
      <div className="p-6">
        <Button onClick={handleBack} variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-red-500">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">Your session has expired or you need to sign in again.</p>
            <Button 
              onClick={() => navigate('/')} 
              variant="default"
              className="mx-auto"
            >
              Go to Login Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }
  
  if (!app) {
    return (
      <div className="p-6">
        <Button onClick={handleBack} variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-red-500">App Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">The application with ID {appId} could not be found or you do not have permission to view it.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {statusMessage && <StatusMessage message={statusMessage} type={statusType} />}
      
      <div className="mb-6 flex items-center justify-between">
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{app.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 mb-4">{app.description}</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-sm font-medium text-gray-700">App ID:</div>
              <div className="text-base">{app.id}</div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-sm font-medium text-gray-700">Status:</div>
              <div className="text-base flex items-center">
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  app.deploymentStatus === 0 ? 'bg-amber-100 text-amber-800' : 
                  app.deploymentStatus === 1 ? 'bg-blue-100 text-blue-800' : 
                  'bg-green-100 text-green-800'
                }`}>
                  {deploymentStatusNames[app.deploymentStatus] || 'Unknown'}
                </span>
                {Boolean(app.isDeleted) && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                    Deleted
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-sm font-medium text-gray-700">Latest Version:</div>
              <div className="text-base">{String(app.latestVersion)}</div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-sm font-medium text-gray-700">Your Permitted Version:</div>
              <div className="text-base">
                {app.permittedVersion !== null 
                  ? app.permittedVersion 
                  : <span className="text-gray-500 italic">Not permitted</span>}
              </div>
            </div>
          </div>
          
          {/* Show upgrade button if newer version is available */}
          {app && app.permittedVersion !== null && app.latestVersion > app.permittedVersion && (
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mt-4">
              <div className="flex items-start">
                <ArrowUpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-grow">
                  <h3 className="text-base font-medium text-gray-800 mb-2">Version Upgrade Available</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    You're currently using version {app.permittedVersion}. Version {app.latestVersion} is now available.
                  </p>
                  
                  {versionStatusText && (
                    <div className="mb-4 p-3 bg-blue-100 text-blue-700 text-sm rounded">
                      {versionStatusText}
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleUpgradeToLatest}
                    disabled={isUpgrading || shouldDisableUpgrade}
                    className="bg-blue-600 hover:bg-blue-700"
                    title={shouldDisableUpgrade ? "Latest version is currently disabled" : undefined}
                  >
                    {isUpgrading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Upgrading...
                      </>
                    ) : 'Upgrade to Latest Version'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Parameters Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Parameter Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {versionInfo ? (
            <>
              <VersionParametersForm 
                versionInfo={versionInfo}
                onChange={handleParametersChange}
                existingParameters={existingParameters}
              />
            </>
          ) : (
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-500">
              {isLoading ? 
                'Loading version information...' : 
                'No version information available for this application.'}
            </div>
          )}
          
          <div className="text-sm text-gray-500 mt-4">
            You can change your parameters anytime by revisiting this page.
          </div>
          
          <div className="mt-6 flex space-x-4">
            <Button 
              onClick={handleApprove} 
              className="flex-1"
              disabled={isSaving || !versionInfo || isUpgrading}
            >
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Updating...
                </>
              ) : 'Save Parameters'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrap the component with providers and layout
const AppDetailsPageWrapped = () => {
  const handleSignOut = (ConsentView as any).handleSignOut;
  const WrappedAppDetailsPage = wrap(AppDetailsPage, [...UserProviders]);
  
  return (
    <UserLayout onSignOut={handleSignOut}>
      <WrappedAppDetailsPage />
    </UserLayout>
  );
};

export default AppDetailsPageWrapped; 