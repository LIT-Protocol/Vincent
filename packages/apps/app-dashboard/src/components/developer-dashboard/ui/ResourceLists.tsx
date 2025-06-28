import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { Logo } from '@/components/shared/ui/Logo';
import { useUserApps } from '@/hooks/developer-dashboard/useUserApps';
import Loading from '@/components/layout/Loading';
import { App, Policy, Tool } from '@/types/developer-dashboard/appTypes';
import { useUserTools } from '@/hooks/developer-dashboard/useUserTools';
import { useUserPolicies } from '@/hooks/developer-dashboard/useUserPolicies';

interface AppsListProps {
  onCreateClick: () => void;
  onAppClick?: (app: App) => void;
}

interface ToolsListProps {
  onCreateClick: () => void;
  onToolClick?: (tool: Tool) => void;
}

interface PoliciesListProps {
  onCreateClick: () => void;
  onPolicyClick?: (policy: Policy) => void;
}

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function AppsList({ onCreateClick, onAppClick }: AppsListProps) {
  const navigate = useNavigate();
  const { data: apps, isLoading, isError } = useUserApps();

  if (isLoading) return <Loading />;
  if (isError) return <StatusMessage message="Failed to load apps" type="error" />;

  return (
    <div className="space-y-6">
      {apps.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">No Apps Yet</h2>
          <p className="text-gray-600 mb-6">Create your first app to get started with Vincent.</p>
          <Button variant="outline" className="text-gray-700" onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2 font-bold text-gray-700" />
            Create App
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {apps.map((app) => (
            <Card
              key={app.appId}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                onAppClick ? onAppClick(app) : navigate(`/developer/appId/${app.appId}`)
              }
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-gray-900">
                  <div className="flex items-center gap-3">
                    <Logo
                      logo={app.logo}
                      alt={`${app.name} logo`}
                      className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                    />
                    <span>{app.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      v{app.activeVersion}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 uppercase">
                      {app.deploymentStatus}
                    </span>
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-700">{app.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700">
                  <div>
                    <span className="font-medium">App ID:</span> {app.appId}
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

export function ToolsList({ onCreateClick, onToolClick }: ToolsListProps) {
  const navigate = useNavigate();
  const { data: tools, isLoading, isError } = useUserTools();

  if (isLoading) return <Loading />;
  if (isError) return <StatusMessage message="Failed to load tools" type="error" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Your Tools</h1>
      </div>

      {tools.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">No Tools Yet</h2>
          <p className="text-gray-600 mb-6">Create your first tool to get started with Vincent.</p>
          <Button variant="outline" className="text-gray-700" onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2 font-bold text-gray-700" />
            Create Tool
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {tools.map((tool) => (
            <Card
              key={tool.packageName}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                onToolClick
                  ? onToolClick(tool)
                  : navigate(`/toolId/${encodeURIComponent(tool.packageName)}`)
              }
            >
              <CardHeader>
                <CardTitle className="text-gray-900">{tool.packageName}</CardTitle>
                <CardDescription className="text-gray-700">
                  {tool.description || 'No description available'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700">
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">Version:</span> {tool.activeVersion || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {tool.createdAt ? formatDate(tool.createdAt) : 'N/A'}
                    </div>
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

export function PoliciesList({ onCreateClick, onPolicyClick }: PoliciesListProps) {
  const navigate = useNavigate();
  const { data: policies, isLoading, isError } = useUserPolicies();

  if (isLoading) return <Loading />;
  if (isError) return <StatusMessage message="Failed to load policies" type="error" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Your Policies</h1>
      </div>

      {policies.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">No Policies Yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first policy to get started with Vincent.
          </p>
          <Button variant="outline" className="text-gray-700" onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2 font-bold text-gray-700" />
            Create Policy
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {policies.map((policy) => (
            <Card
              key={policy.packageName}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                onPolicyClick
                  ? onPolicyClick(policy)
                  : navigate(`/policyId/${encodeURIComponent(policy.packageName)}`)
              }
            >
              <CardHeader>
                <CardTitle className="text-gray-900">{policy.packageName}</CardTitle>
                <CardDescription className="text-gray-700">
                  {policy.description || 'No description available'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700">
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">Version:</span> {policy.activeVersion || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {policy.createdAt ? formatDate(policy.createdAt) : 'N/A'}
                    </div>
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
