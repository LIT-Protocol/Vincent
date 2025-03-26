import { AppView } from '@/services/types';
import { useEffect, useState, useRef, useCallback } from 'react';
import DelegateeManagerScreen from './dashboard/ManageDelegatee';
import ManageToolPoliciesScreen from './dashboard/ManageToolPolicies';
import ManageAdvancedFunctionsScreen from './dashboard/ManageAdvancedFunctions';
import CreateAppScreen from './CreateApp';
import { ArrowRight, Plus, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { mapEnumToTypeName } from '@/services/types';
import { useErrorPopup } from '@/providers/error-popup';
import { GetAppsByManager } from '../contracts/GetAppsByManager';
// The styles are now included in the main dashboard.css imported in layout.tsx

// Status message component
const StatusMessage = ({ message, type = 'info' }: { message: string, type?: 'info' | 'warning' | 'success' | 'error' }) => {
  if (!message) return null;
  
  const getStatusClass = () => {
    switch (type) {
      case 'warning': return 'status-message--warning';
      case 'success': return 'status-message--success';
      case 'error': return 'status-message--error';
      default: return 'status-message--info';
    }
  };
  
  return (
    <div className={`status-message ${getStatusClass()}`}>
      {type === 'info' && <div className="spinner"></div>}
      <span>{message}</span>
    </div>
  );
};

export default function DashboardScreen({
  vincentApp,
  onRefetch,
}: {
  vincentApp: AppView[];
  onRefetch: () => void;
}) {
  const [dashboard, setDashboard] = useState<AppView[]>([]);
  const [showManageApp, setShowManageApp] = useState(false);
  const [showDelegateeManager, setShowDelegateeManager] = useState(false);
  const [showToolPolicies, setShowToolPolicies] = useState(false);
  const [showAdvancedFunctions, setShowAdvancedFunctions] = useState(false);
  const [showCreateApp, setShowCreateApp] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AppView | null>(null);
  const selectedAppIdRef = useRef<number | null>(null);
  
  // Add status message state
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  
  // Add the error popup hook
  const { showError } = useErrorPopup();
  
  // Helper function to set status messages
  const showStatus = useCallback((message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
  }, []);
  
  // Clear status message
  const clearStatus = useCallback(() => {
    setStatusMessage('');
  }, []);
  
  // Create enhanced error function that shows both popup and status error
  const showErrorWithStatus = useCallback((errorMessage: string, title?: string, details?: string) => {
    // Show error in popup
    showError(errorMessage, title || 'Error', details);
    // Also show in status message
    showStatus(errorMessage, 'error');
  }, [showError, showStatus]);

  useEffect(() => {
    if (vincentApp) {
      try {
        setDashboard(vincentApp);
        
        // Update selectedApp if it exists and matches one of the refreshed apps
        if (selectedApp && selectedAppIdRef.current === selectedApp.appId) {
          const refreshedApp = vincentApp.find(app => app.appId === selectedApp.appId);
          if (refreshedApp) {
            setSelectedApp(refreshedApp);
          }
        }
      } catch (error) {
        console.error('Dashboard Error:', error);
        showErrorWithStatus(error instanceof Error ? error.message : 'Error loading dashboard', 'Dashboard Error');
      } finally {
        setIsRefetching(false);
      }
    }
  }, [vincentApp, selectedApp, showErrorWithStatus]);

  // Update the ref whenever selectedApp changes
  useEffect(() => {
    if (selectedApp) {
      selectedAppIdRef.current = selectedApp.appId;
    } else {
      selectedAppIdRef.current = null;
    }
  }, [selectedApp]);

  const handleRefetch = async () => {
    setIsRefetching(true);
    showStatus('Refreshing dashboard...', 'info');
    try {
      await onRefetch();
      clearStatus();
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
      showErrorWithStatus(error instanceof Error ? error.message : 'Failed to refresh dashboard', 'Refresh Error');
      setIsRefetching(false);
    }
  };

  if (!dashboard || isRefetching) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm text-gray-600">
            {isRefetching ? 'Refreshing...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (showCreateApp) {
    return (
      <CreateAppScreen
        onBack={() => setShowCreateApp(false)}
        onSuccess={() => {
          setShowCreateApp(false);
          showStatus('App created successfully', 'success');
          handleRefetch();
        }}
      />
    );
  }

  if (showDelegateeManager && selectedApp) {
    return (
      <DelegateeManagerScreen
        onBack={() => {
          setShowDelegateeManager(false);
          showStatus('Returning to dashboard...', 'info');
          handleRefetch();
        }}
        dashboard={selectedApp}
      />
    );
  }

  if (showToolPolicies && selectedApp) {
    return (
      <ManageToolPoliciesScreen
        onBack={() => {
          setShowToolPolicies(false);
          showStatus('Returning to dashboard...', 'info');
          handleRefetch();
        }}
        dashboard={selectedApp}
      />
    );
  }
  
  if (showAdvancedFunctions && selectedApp) {
    return (
      <ManageAdvancedFunctionsScreen
        onBack={() => {
          setShowAdvancedFunctions(false);
          showStatus('Returning to dashboard...', 'info');
          handleRefetch();
        }}
        dashboard={selectedApp}
        onSuccess={() => {
          showStatus('Operation completed successfully', 'success');
          handleRefetch();
        }}
      />
    );
  }

  if (selectedApp) {
    return (
      <div className="space-y-8">
        {/* Show status message at the top of the dashboard */}
        {statusMessage && <StatusMessage message={statusMessage} type={statusType} />}
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedApp(null)}
              className="p-0 text-black"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
            </Button>
            <h1 className="text-3xl font-bold text-black">{selectedApp.appName}</h1>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="default"
              onClick={() => setShowDelegateeManager(true)}
              className="text-black"
            >
              <Plus className="h-4 w-4 mr-2 font-bold text-black" />
              Manage Delegatees
            </Button>
            <Button
              variant="default"
              onClick={() => setShowToolPolicies(true)}
              className="text-black"
            >
              <Plus className="h-4 w-4 mr-2 font-bold text-black" />
              Manage Tool Policies
            </Button>
            <Button
              variant="default"
              onClick={() => setShowAdvancedFunctions(true)}
              className="text-black"
            >
              <Settings className="h-4 w-4 mr-2 font-bold text-black" />
              Advanced Functions
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-black">App Details</CardTitle>
              <CardDescription className="text-black">{selectedApp.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-black">
                  <span className="font-medium">App ID:</span> {selectedApp.appId}
                </div>
                <div className="text-sm text-black">
                  <span className="font-medium">Management Wallet:</span>{' '}
                  {selectedApp.managementWallet}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-black">Tool Policies</CardTitle>
              <CardDescription className="text-black">
                {selectedApp.toolPolicies.length === 0
                  ? 'No tool policies configured yet.'
                  : `${selectedApp.toolPolicies.length} app versions with tool policies`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedApp.toolPolicies.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-black">
                    No Tool Policies Yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...selectedApp.toolPolicies]
                    .sort((a, b) => {
                      // Extract version numbers for comparison
                      const versionA = Array.isArray(a) ? a[0] : a.version;
                      const versionB = Array.isArray(b) ? b[0] : b.version;
                      return Number(versionB) - Number(versionA); // Sort in descending order
                    })
                    .map((versionData, i) => {
                    // Extract values from the array and named properties
                    const version = versionData.version || versionData[0];
                    const enabled = versionData.enabled !== undefined ? versionData.enabled : versionData[1];
                    const tools = versionData.tools || versionData[3];
                    
                    if (!tools || tools.length === 0) return null;

                    return (
                      <div key={i} className={`mb-4 ${i === 0 ? 'bg-green-50 p-4 rounded-lg' : ''}`}>
                        <div className="font-medium mb-2 text-black">
                          Version: {version.toString()} {enabled ? "(Enabled)" : "(Disabled)"}
                          {i === 0 && <span className="ml-2 text-xs text-green-600">(Latest)</span>}
                        </div>
                        
                        {tools.map((tool: any, j: number) => {
                          // Extract tool data (supports both array and object format)
                          const toolData = Array.isArray(tool) 
                            ? { 
                                toolIpfsCid: tool[0], 
                                policies: Array.isArray(tool[1]) ? tool[1] : [],
                                // Check if we have direct parameter data at the tool level (new format)
                                parameterNames: Array.isArray(tool[2]) ? tool[2] : [],
                                parameterTypes: Array.isArray(tool[3]) ? tool[3] : []
                              } 
                            : tool;

                          // Check if there are parameter names/types directly on the tool (new format)
                          const hasDirectParameters = toolData.parameterNames && 
                                                    toolData.parameterNames.length > 0 &&
                                                    toolData.parameterTypes && 
                                                    toolData.parameterTypes.length > 0;

                          // For debugging
                          console.log('Tool Data:', {
                            toolCID: toolData.toolIpfsCid,
                            policies: toolData.policies,
                            directParams: {
                              names: toolData.parameterNames,
                              types: toolData.parameterTypes
                            },
                            hasDirectParameters
                          });

                          return (
                            <div key={j} className="border-b border-gray-100 pb-2 mb-2 ml-4 text-black">
                              <div className="font-medium mb-1">Tool CID:</div>
                              <div className="text-sm truncate">
                                {toolData.toolIpfsCid ? 
                                  toolData.toolIpfsCid : 
                                  'No CID available'}
                              </div>
                              
                              {/* Check for either policies array or direct parameters */}
                              {(toolData.policies && toolData.policies.length > 0) || hasDirectParameters ? (
                                <div className="mt-2">
                                  <div className="font-medium mb-1">Policies:</div>
                                  <div className="pl-2 text-sm">
                                    {/* Show direct parameters if they exist (new format) */}
                                    {hasDirectParameters && (
                                      <div className="mb-1">
                                        <div className="text-xs">
                                          <div>
                                            <span className="font-medium">Parameters:</span>
                                            <ul className="ml-2 mt-1">
                                              {toolData.parameterNames.map((name: string, paramIndex: number) => (
                                                <li key={paramIndex}>
                                                  {name}: {paramIndex < toolData.parameterTypes.length ? 
                                                    mapEnumToTypeName(Number(toolData.parameterTypes[paramIndex])) : 
                                                    'unknown type'}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Show policies if they exist (old format) */}
                                    {toolData.policies && toolData.policies.length > 0 && toolData.policies.map((policy: any, k: number) => {
                                      // Extract policy data (supports both array and object format)
                                      const policyData = Array.isArray(policy)
                                        ? { 
                                            policyIpfsCid: policy[0] || '', 
                                            parameterNames: Array.isArray(policy[1]) ? policy[1] : [],
                                            parameterTypes: Array.isArray(policy[2]) ? policy[2] : []
                                          }
                                        : policy || {};

                                      // Debug data structure
                                      console.log('Policy Data:', {
                                        raw: policy,
                                        processed: policyData,
                                        hasParameterNames: policyData.parameterNames && policyData.parameterNames.length > 0,
                                        hasParameterTypes: policyData.parameterTypes && policyData.parameterTypes.length > 0,
                                        parameterNames: policyData.parameterNames,
                                        parameterTypes: policyData.parameterTypes
                                      });

                                      return (
                                        <div key={k} className="mb-1">
                                          <div className="text-xs">
                                            <span className="font-medium">Policy CID:</span> {policyData.policyIpfsCid || 'No policy CID'}<br/>
                                            
                                            {/* Display parameter types and names together */}
                                            {policyData.parameterTypes && policyData.parameterTypes.length > 0 && 
                                             policyData.parameterNames && policyData.parameterNames.length > 0 ? (
                                              <div>
                                                <span className="font-medium">Parameters:</span>
                                                <ul className="ml-2 mt-1">
                                                  {policyData.parameterNames.map((name: string, paramIndex: number) => (
                                                    <li key={paramIndex}>
                                                      {name}: {paramIndex < policyData.parameterTypes.length ? 
                                                        mapEnumToTypeName(Number(policyData.parameterTypes[paramIndex])) : 
                                                        'unknown type'}
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            ) : (
                                              <>
                                                <span className="text-xs italic">(No parameters)</span>
                                                <br/>
                                                <span className="text-xs font-mono bg-gray-100 p-1 block mt-1 overflow-x-auto">
                                                  Debug: Names={JSON.stringify(policyData.parameterNames)}, 
                                                  Types={JSON.stringify(policyData.parameterTypes)}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-2">
                                  <div className="text-xs italic">No policies defined for this tool</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-black">Delegatees</CardTitle>
              <CardDescription className="text-black">
                {selectedApp.delegatees.length === 0
                  ? 'No delegatees configured yet.'
                  : `${selectedApp.delegatees.length} delegatees configured`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedApp.delegatees.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-black">
                    Add delegatees to execute your application
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedApp.delegatees.map((delegatee, i) => (
                    <div key={i} className="text-sm text-black">
                      <code className="bg-gray-50 px-1 py-0.5 rounded text-xs">{delegatee}</code>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main dashboard view when no app is selected
  return (
    <div className="space-y-6">
    <GetAppsByManager/>

      {/* Show status message at the top of the dashboard */}
      {statusMessage && <StatusMessage message={statusMessage} type={statusType} />}
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-black">Dashboard</h1>
        <Button
          variant="default"
          className="text-black"
          onClick={() => setShowCreateApp(true)}
        >
          <Plus className="h-4 w-4 mr-2 font-bold text-black" />
          Create App
        </Button>
      </div>

      {dashboard.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4 text-black">No Apps Yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first app to get started with Lit Protocol.
          </p>
          <Button
            variant="default"
            className="text-black"
            onClick={() => setShowCreateApp(true)}
          >
            <Plus className="h-4 w-4 mr-2 font-bold text-black" />
            Create App
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboard.map((app, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedApp(app)}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-black">
                  <span>{app.appName}</span>
                </CardTitle>
                <CardDescription className="text-black">
                  {app.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-black">
                  <div className="mb-2">
                    <span className="font-medium">App ID:</span> {app.appId}
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Management Wallet:</span>{' '}
                    {app.managementWallet?.substring(0, 8)}...
                    {app.managementWallet?.substring(app.managementWallet.length - 6)}
                  </div>
                  <div>
                    <span className="font-medium">Tool Policies:</span>{' '}
                    {app.toolPolicies?.length || 0}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
