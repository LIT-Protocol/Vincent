import { AppView } from '@/services/types';
import { useEffect, useState, useRef } from 'react';
import ManageAppScreen from './dashboard/ManageApp';
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

  useEffect(() => {
    if (vincentApp) {
      setDashboard(vincentApp);
      
      // Update selectedApp if it exists and matches one of the refreshed apps
      if (selectedApp && selectedAppIdRef.current === selectedApp.appId) {
        const refreshedApp = vincentApp.find(app => app.appId === selectedApp.appId);
        if (refreshedApp) {
          setSelectedApp(refreshedApp);
        }
      }
      
      setIsRefetching(false);
    }
  }, [vincentApp]);

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
    await onRefetch();
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
          handleRefetch();
        }}
      />
    );
  }

  if (showManageApp) {
    return (
      <ManageAppScreen
        onBack={() => setShowManageApp(false)}
        dashboard={selectedApp || dashboard[0]}
        onSuccess={() => {
          setShowManageApp(false);
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
          handleRefetch();
        }}
        dashboard={selectedApp}
        onSuccess={handleRefetch}
      />
    );
  }

  if (selectedApp) {
    return (
      <div className="space-y-8">
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
                  {selectedApp.toolPolicies.map((versionData, i) => {
                    // Extract values from the array and named properties
                    const version = versionData.version || versionData[0];
                    const enabled = versionData.enabled !== undefined ? versionData.enabled : versionData[1];
                    const tools = versionData.tools || versionData[3];
                    
                    if (!tools || tools.length === 0) return null;

                    return (
                      <div key={i} className="mb-4">
                        <div className="font-medium mb-2 text-black">
                          Version: {version.toString()} {enabled ? "(Enabled)" : "(Disabled)"}
                        </div>
                        
                        {tools.map((tool: any, j: number) => {
                          // Extract tool data (supports both array and object format)
                          const toolData = Array.isArray(tool) 
                            ? { 
                                toolIpfsCid: tool[0], 
                                policies: Array.isArray(tool[1]) ? tool[1] : [] 
                              } 
                            : tool;

                          return (
                            <div key={j} className="border-b border-gray-100 pb-2 mb-2 ml-4 text-black">
                              <div className="font-medium mb-1">Tool CID:</div>
                              <div className="text-sm truncate">
                                {toolData.toolIpfsCid ? 
                                  toolData.toolIpfsCid : 
                                  'No CID available'}
                              </div>
                              
                              {toolData.policies && toolData.policies.length > 0 ? (
                                <div className="mt-2">
                                  <div className="font-medium mb-1">Policies:</div>
                                  <div className="pl-2 text-sm">
                                    {toolData.policies.map((policy: any, k: number) => {
                                      // Extract policy data (supports both array and object format)
                                      const policyData = Array.isArray(policy)
                                        ? { 
                                            policyIpfsCid: policy[0] || '', 
                                            policySchemaIpfsCid: policy[1] || '', 
                                            parameterNames: policy[2] || [] 
                                          }
                                        : policy || {};

                                      return (
                                        <div key={k} className="mb-1">
                                          <div className="text-xs">
                                            <span className="font-medium">Policy CID:</span> {policyData.policyIpfsCid || 'No policy CID'}<br/>
                                            <span className="font-medium">Schema CID:</span> {policyData.policySchemaIpfsCid || 'No schema'}<br/>
                                            {policyData.parameterNames && policyData.parameterNames.length > 0 ? (
                                              <span>
                                                <span className="font-medium">Parameters:</span> {policyData.parameterNames.join(', ')}
                                              </span>
                                            ) : (
                                              <span className="text-xs italic">(No parameters)</span>
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
                    Add delegatees to allow other wallets to manage your app
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-black">Your Apps</h1>
        <Button variant="default" onClick={() => setShowCreateApp(true)} className="text-black">
          <Plus className="h-4 w-4 mr-2" />
          Create New App
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboard.map((app, i) => (
          <Card
            key={i}
            onClick={() => setSelectedApp(app)}
            className="cursor-pointer hover:shadow-md transition-shadow duration-200"
          >
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="font-bold text-lg text-black truncate">
                  {app.appName}
                </div>
                <div className="text-sm text-black line-clamp-2 h-10">
                  {app.description || 'No description'}
                </div>
                <div className="mt-4 pt-3 border-t text-xs text-black">
                  <div className="mb-2">
                    <div className="font-medium mb-1">App ID: {app.appId}</div>
                    <div className="font-medium mb-1">Version: {app.currentVersion}</div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Tools:</div>
                    {app.toolPolicies?.length > 0 ? (
                      <div className="max-h-20 overflow-y-auto">
                        {app.toolPolicies.map((tool: any, j: number) => (
                          <div key={j} className="mb-1 truncate">
                            {tool.toolIpfsCid?.slice(0, 8)}...{tool.toolIpfsCid?.slice(-6) || 'Unknown'}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs">No policies configured</div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium mb-1">Delegatees:</div>
                    {app.delegatees?.length > 0 ? (
                      <div className="max-h-20 overflow-y-auto text-xs">
                        {app.delegatees.map((delegatee, i) => (
                          <div key={i} className="mb-1 truncate">
                            {delegatee.slice(0, 8)}...{delegatee.slice(-6)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs">No delegatees added</div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-center text-black mt-2">
                  Manage App
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
