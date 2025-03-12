import { VincentApp } from '@/types';
import { useEffect, useState } from 'react';
import ManageAppScreen from './dashboard/ManageApp';
import CreateRoleScreen from './dashboard/CreateRole';
import ManageRoleScreen from './dashboard/ManageRole';
import DelegateeManagerScreen from './dashboard/ManageDelegatee';
import { ArrowRight } from 'lucide-react';
import { Plus, Settings } from 'lucide-react';
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

export default function DashboardScreen({
  vincentApp,
  onRefetch,
}: {
  vincentApp: VincentApp;
  onRefetch: () => void;
}) {
  const [dashboard, setDashboard] = useState<VincentApp>();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [showManageApp, setShowManageApp] = useState(false);
  const [showDelegateeManager, setShowDelegateeManager] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

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

  if (showManageApp) {
    return (
      <ManageAppScreen
        onBack={() => setShowManageApp(false)}
        dashboard={dashboard}
        onSuccess={() => {
          setShowManageApp(false);
          handleRefetch();
        }}
      />
    );
  }

  if (showDelegateeManager) {
    return (
      <DelegateeManagerScreen
        onBack={() => setShowDelegateeManager(false)}
        dashboard={dashboard}
      />
    );
  }

  if (showCreateRole) {
    return (
      <CreateRoleScreen
        onBack={() => setShowCreateRole(false)}
        dashboard={dashboard}
        onSuccess={() => {
          setShowCreateRole(false);
          handleRefetch();
        }}
      />
    );
  }

  if (selectedRoleId && dashboard) {
    return (
      <ManageRoleScreen
        onBack={() => setSelectedRoleId(null)}
        dashboard={dashboard}
        onSuccess={() => {
          setSelectedRoleId(null);
          handleRefetch();
        }}
        roleId={selectedRoleId}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{dashboard.appMetadata.appName}</h1>
        <div className="flex gap-2 items-center">
          <Button variant="default" onClick={() => setShowManageApp(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Manage App
          </Button>
          <Button variant="default" onClick={() => setShowCreateRole(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Role
          </Button>
          <Button
            variant="default"
            onClick={() => setShowDelegateeManager(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Delegatee
          </Button>
        </div>
      </div>

      {dashboard?.roles.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Roles Found</CardTitle>
            <CardDescription>
              You haven&apos;t created any roles yet.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboard?.roles.map((role) => (
            <Card key={role.roleId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{role.roleName}</CardTitle>
                    <CardDescription className="mt-2">
                      {role.roleDescription}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      // role.enabled
                      //     ? "default"
                      //     : "secondary"

                      'secondary'
                    }
                  >
                    {/* {role.enabled ? "Enabled" : "Disabled"} */}
                    {'Enabled'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm">
                    <span className="font-medium">Role ID:</span> {role.roleId}
                  </div>
                  {/* <div className="text-sm">
                                        <span className="font-medium">
                                            Role Version:
                                        </span>{" "}
                                        {role.roleId}
                                    </div> */}
                  <Button
                    className="w-full"
                    onClick={() => setSelectedRoleId(role.roleId)}
                  >
                    Manage Role <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
