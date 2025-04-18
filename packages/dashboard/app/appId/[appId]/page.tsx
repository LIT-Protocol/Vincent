"use client";

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formCompleteVincentAppForDev } from '@/services';
import { useAccount } from 'wagmi';
import { AppView } from '@/services/types';
import { ArrowRight, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { mapEnumToTypeName } from '@/services/types';
import { useErrorPopup } from '@/providers/error-popup';
import { StatusMessage } from '@/utils/statusMessage';
import { AppUrlGenerator } from '@/components/developer/dashboard/AppUrlGenerator';

export default function AppDetailPage() {
  const params = useParams();
  const appIdParam = params.appId;
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [app, setApp] = useState<AppView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  
  // Add the error popup hook
  const { showError } = useErrorPopup();
  
  // Helper function to set status messages
  const showStatus = useCallback((message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
  }, []);
  
  // Create enhanced error function that shows both popup and status error
  const showErrorWithStatus = useCallback((errorMessage: string, title?: string, details?: string) => {
    // Show error in popup
    showError(errorMessage, title || 'Error', details);
    // Also show in status message
    showStatus(errorMessage, 'error');
  }, [showError, showStatus]);
  
  const loadAppData = useCallback(async () => {
    if (!address || !appIdParam) return;
    
    try {
      setIsLoading(true);
      const appData = await formCompleteVincentAppForDev(address);
      
      if (appData && appData.length > 0) {
        // Find the specific app by appId
        const foundApp = appData.find(app => app.appId && app.appId.toString() === appIdParam);
        if (foundApp) {
          setApp(foundApp);
        } else {
          // If app not found, navigate back to dashboard
          router.push('/');
        }
      } else {
        // If no apps found, navigate back to dashboard
        router.push('/');
      }
    } catch (error) {
      console.error("Error loading app data:", error);
      showErrorWithStatus("Failed to load app data", "Error");
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [address, appIdParam, router, showErrorWithStatus]);
  
  useEffect(() => {
    if (isConnected) {
      loadAppData();
    } else {
      router.push('/');
    }
  }, [isConnected, loadAppData, router]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!app) {
    return null;
  }
  
  return (
    <div className="space-y-8">
      {statusMessage && <StatusMessage message={statusMessage} type={statusType} />}
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="p-0 text-black"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
          </Button>
          <h1 className="text-3xl font-bold text-black">{app.appName}</h1>
        </div>
        <div className="flex gap-2 items-center">
          {app.authorizedRedirectUris && app.authorizedRedirectUris.length > 0 && (
            <AppUrlGenerator app={app} />
          )}
          <Button
            variant="default"
            onClick={() => router.push(`/appId/${app.appId}/delegatee`)}
            className="text-black"
          >
            <Plus className="h-4 w-4 mr-2 font-bold text-black" />
            Manage Delegatees
          </Button>
          <Button
            variant="default"
            onClick={() => router.push(`/appId/${app.appId}/tool-policies`)}
            className="text-black"
          >
            <Plus className="h-4 w-4 mr-2 font-bold text-black" />
            Manage Tool Policies
          </Button>
          <Button
            variant="default"
            onClick={() => router.push(`/appId/${app.appId}/advanced-functions`)}
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
            <CardDescription className="text-black">{app.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-black">
                <span className="font-medium">App ID:</span> {app.appId}
              </div>
              <div className="text-sm text-black">
                <span className="font-medium">Management Wallet:</span>{' '}
                {app.managementWallet}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-black">Tool Policies</CardTitle>
            <CardDescription className="text-black">
              {app.toolPolicies.length === 0
                ? 'No tool policies configured yet.'
                : `${app.toolPolicies.length} app versions with tool policies`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {app.toolPolicies.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-black">
                  No Tool Policies Yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  return [...app.toolPolicies]
                  .sort((a, b) => {            
                    // Handle the array-object hybrid format
                    const versionA = a.version || (a[0] ? a[0] : 0);
                    const versionB = b.version || (b[0] ? b[0] : 0);
                    
                    return Number(versionB) - Number(versionA);
                  })
                  .map((versionData, i) => {
                    try {
                      const version = versionData.version;
                      const enabled = versionData.enabled;
                      const tools = versionData.tools;
                      
                      if (!tools || tools.length === 0) {
                        return (
                          <div key={i} className={`mb-4 ${i === 0 ? 'bg-green-50 p-4 rounded-lg' : ''}`}>
                            <div className="font-medium mb-2 text-black">
                              Version: {version.toString()} {enabled ? "(Enabled)" : "(Disabled)"}
                              {i === 0 && <span className="ml-2 text-xs text-green-600">(Latest)</span>}
                            </div>
                            <p className="text-sm italic text-gray-500">No tools configured</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={i} className={`mb-4 ${i === 0 ? 'bg-green-50 p-4 rounded-lg' : ''}`}>
                          <div className="font-medium mb-2 text-black">
                            Version: {version.toString()} {enabled ? "(Enabled)" : "(Disabled)"}
                            {i === 0 && <span className="ml-2 text-xs text-green-600">(Latest)</span>}
                          </div>
                          
                          {tools.map((tool: any, j: number) => {
                            return (
                              <div key={j} className="border-b border-gray-100 pb-2 mb-2 ml-4 text-black">
                                <div className="font-medium mb-1">Tool CID:</div>
                                <div className="text-sm truncate">
                                  {tool.toolIpfsCid}
                                </div>
                                
                                {tool.policies && tool.policies.length > 0 ? (
                                  <div className="mt-2">
                                    <div className="font-medium mb-1">Policies:</div>
                                    <div className="pl-2 text-sm">
                                      {tool.policies.map((policy: any, k: number) => {
                                        return (
                                          <div key={k} className="mb-1">
                                            <div className="text-xs">
                                              <span className="font-medium">Policy CID:</span> {policy.policyIpfsCid}<br/>
                                              
                                              {policy.parameterTypes && policy.parameterNames && 
                                               policy.parameterTypes.length > 0 && policy.parameterNames.length > 0 ? (
                                                <div>
                                                  <span className="font-medium">Parameters:</span>
                                                  <ul className="ml-2 mt-1">
                                                    {policy.parameterNames.map((name: string, paramIndex: number) => (
                                                      <li key={paramIndex}>
                                                        {name}: {mapEnumToTypeName(Number(policy.parameterTypes[paramIndex]))}
                                                      </li>
                                                    ))}
                                                  </ul>
                                                </div>
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
                    } catch (error) {
                      console.error(`Error rendering item ${i}:`, error);
                      return (
                        <div key={i} className="mb-4 p-4 bg-red-50 rounded-lg">
                          <div className="text-red-800">Error rendering version: {(error as Error).message}</div>
                          <pre className="text-xs overflow-auto mt-2">{JSON.stringify(versionData, null, 2)}</pre>
                        </div>
                      );
                    }
                  });
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-black">Delegatees</CardTitle>
            <CardDescription className="text-black">
              {app.delegatees.length === 0
                ? 'No delegatees configured yet.'
                : `${app.delegatees.length} delegatees configured`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!app.delegatees || !Array.isArray(app.delegatees) || app.delegatees.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-black">
                  Add delegatees to execute your application
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {app.delegatees.map((delegatee, i) => (
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