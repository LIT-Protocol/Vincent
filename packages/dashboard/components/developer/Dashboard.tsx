import { VincentApp } from '@/services/types';
import { useEffect, useState } from 'react';
import ManageAppScreen from './dashboard/ManageApp';
import DelegateeManagerScreen from './dashboard/ManageDelegatee';
import ManageToolPoliciesScreen from './dashboard/ManageToolPolicies';
import CreateAppScreen from './CreateApp';
import { ArrowRight, Plus, Settings, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { useAccount } from 'wagmi';
import { VincentContracts } from '@/services';

export default function DashboardScreen({
  vincentApp,
  onRefetch,
}: {
  vincentApp: VincentApp[];
  onRefetch: () => void;
}) {
  const [dashboard, setDashboard] = useState<VincentApp[]>([]);
  const [showManageApp, setShowManageApp] = useState(false);
  const [showDelegateeManager, setShowDelegateeManager] = useState(false);
  const [showToolPolicies, setShowToolPolicies] = useState(false);
  const [showCreateApp, setShowCreateApp] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [selectedApp, setSelectedApp] = useState<VincentApp | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const { address } = useAccount();

  useEffect(() => {
    if (vincentApp) {
      setDashboard(vincentApp);
      setIsRefetching(false);
    }
  }, [vincentApp]);

  const handleRefetch = async () => {
    setIsRefetching(true);
    await onRefetch();
  };

  async function handleToggleEnabled() {
    if (!address || !selectedApp) return;

    try {
      setIsToggling(true);
      const contracts = new VincentContracts('datil');
      await contracts.enableAppVersion(
        selectedApp.appId,
        selectedApp.currentVersion,
        !selectedApp.isEnabled
      );

      // Update the local state immediately to reflect the change
      const updatedApp = {
        ...selectedApp,
        isEnabled: !selectedApp.isEnabled,
      };
      setSelectedApp(updatedApp);

      // Update the dashboard state as well
      setDashboard((prevDashboard) =>
        prevDashboard.map((app) =>
          app.appId === selectedApp.appId ? updatedApp : app
        )
      );

      await handleRefetch();
    } catch (error) {
      console.error('Error toggling app status:', error);
    } finally {
      setIsToggling(false);
    }
  }

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
        onBack={() => setShowDelegateeManager(false)}
        dashboard={selectedApp}
        onSuccess={() => {
          setShowDelegateeManager(false);
          handleRefetch();
        }}
      />
    );
  }

  if (showToolPolicies && selectedApp) {
    return (
      <ManageToolPoliciesScreen
        onBack={() => setShowToolPolicies(false)}
        dashboard={selectedApp}
        onSuccess={() => {
          setShowToolPolicies(false);
          handleRefetch();
        }}
        onUpdateToolPolicies={(newToolPolicies) => {
          // Update selected app state
          const updatedApp = {
            ...selectedApp,
            toolPolicies: newToolPolicies
          };
          setSelectedApp(updatedApp);
          
          // Update dashboard state
          setDashboard(prevDashboard => 
            prevDashboard.map(app => 
              app.appId === selectedApp.appId ? updatedApp : app
            )
          );
        }}
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
              className="p-0"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
            </Button>
            <h1 className="text-3xl font-bold">{selectedApp.appName}</h1>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="default"
              className="bg-black text-white"
              onClick={handleToggleEnabled}
              disabled={isToggling}
            >
              {isToggling
                ? 'Updating...'
                : selectedApp.isEnabled
                ? 'Disable App'
                : 'Enable App'}
            </Button>
            {/* <Button variant="default" onClick={() => setShowManageApp(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Manage App
            </Button> */}
            <Button
              variant="default"
              onClick={() => setShowDelegateeManager(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Manage Delegatees
            </Button>
            <Button variant="default" onClick={() => setShowToolPolicies(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Manage Tool Policies
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>App Details</CardTitle>
              <CardDescription>{selectedApp.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm">
                  <span className="font-medium">App ID:</span>{' '}
                  {selectedApp.appId}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Management Wallet:</span>{' '}
                  {selectedApp.managementWallet}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Status:</span>{' '}
                  <Badge
                    variant={selectedApp.isEnabled ? 'default' : 'secondary'}
                  >
                    {selectedApp.isEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tool Policies</CardTitle>
              <CardDescription>
                {selectedApp.toolPolicies.length === 0
                  ? 'No tool policies configured yet.'
                  : `${selectedApp.toolPolicies.length} tool policies configured`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedApp.toolPolicies.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">No Tool Policies Yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedApp.toolPolicies.map((toolPolicy, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle>Tool Policy {index + 1}</CardTitle>
                        <CardDescription>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium">Tool IPFS CID:</span>{' '}
                            <a 
                              href={`/ipfs/${toolPolicy.toolIpfsCid}`}
                              className="text-black hover:text-gray-800 hover:underline cursor-pointer inline-flex items-center gap-1"
                              rel="noopener noreferrer"
                            >
                              {toolPolicy.toolIpfsCid}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <div className="text-sm space-y-2">
                            {toolPolicy.policies.length === 0 ? (
                              <div className="text-gray-600">No policies configured</div>
                            ) : (
                              toolPolicy.policies.map((policy, index) => (
                                <div key={index} className="border rounded-lg p-3 space-y-2">
                                  {/* <div className="font-medium">Policy {index + 1}</div> */}
                                  <div className="space-y-1">
                                    <div>
                                      <span className="font-medium">Policy IPFS CID:</span>{' '}
                                      <a 
                                        href={`/ipfs/${policy.policyIpfsCid}`}
                                        className="text-black hover:text-gray-800 hover:underline cursor-pointer inline-flex items-center gap-1"
                                        rel="noopener noreferrer"
                                      >
                                        {policy.policyIpfsCid}
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </div>
                                    <div>
                                      <span className="font-medium">Schema IPFS CID:</span>{' '}
                                      <a 
                                        href={`/ipfs/${policy.policySchemaIpfsCid}`}
                                        className="text-black hover:text-gray-800 hover:underline cursor-pointer inline-flex items-center gap-1"
                                        rel="noopener noreferrer"
                                      >
                                        {policy.policySchemaIpfsCid}
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </div>
                                    <div>
                                      <span className="font-medium">Parameter Names:</span>{' '}
                                      {policy.parameterNames.length === 0 ? (
                                        <span className="text-gray-600">None</span>
                                      ) : (
                                        <span className="text-black">{policy.parameterNames.join(', ')}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delegatees</CardTitle>
              <CardDescription>
                {selectedApp.delegatees.length === 0
                  ? 'No delegatees configured yet.'
                  : `${selectedApp.delegatees.length} delegatees configured`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedApp.delegatees.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">
                    Add delegatees to allow other wallets to manage your app
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedApp.delegatees.map((delegatee, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">
                        Delegatee {index + 1}:
                      </span>{' '}
                      {delegatee}
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
        <h1 className="text-3xl font-bold">Your Apps</h1>
        <Button variant="default" onClick={() => setShowCreateApp(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New App
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboard.map((app, index) => (
          <Card
            key={`${index}`}
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => setSelectedApp(app)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{app.appName}</CardTitle>
                </div>
                <Badge variant={app.isEnabled ? 'default' : 'secondary'}>
                  {app.isEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{app.toolPolicies.length} Tool Policies</span>
                  <span>{app.delegatees?.length} Delegatees</span>
                </div>
                <div className="text-sm text-center">Manage App</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
