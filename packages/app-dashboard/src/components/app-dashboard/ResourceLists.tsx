import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/app-dashboard/ui/card';
import { StatusFilterDropdown, FilterOption } from './ui/status-filter-dropdown';
import { StatusMessage } from '@/utils/shared/statusMessage';

// Define filter options
const statusFilterOptions: FilterOption[] = [
  { id: 'all', label: 'All Applications' },
  { id: 'dev', label: 'DEV' },
  { id: 'test', label: 'TEST' },
  { id: 'prod', label: 'PROD' },
];

interface AppsListProps {
  apps: any[];
  isLoading: boolean;
  error: any;
  sortOption: string;
  onSortChange: (option: string) => void;
  onCreateClick: () => void;
  onAppClick?: (app: any) => void;
}

interface ToolsListProps {
  tools: any[];
  isLoading: boolean;
  error: any;
  onCreateClick: () => void;
}

interface PoliciesListProps {
  policies: any[];
  isLoading: boolean;
  error: any;
  onCreateClick: () => void;
}

// Helper function to truncate address
const truncateAddress = (address: string) => {
  if (!address) return 'N/A';
  return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
};

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

export function AppsList({
  apps,
  isLoading,
  error,
  sortOption,
  onSortChange,
  onCreateClick,
  onAppClick,
}: AppsListProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-4">Loading apps...</p>
      </div>
    );
  }

  if (error) {
    return <StatusMessage message={`Failed to load your apps: ${error}`} type="error" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Your Apps</h1>
        <div className="flex gap-3">
          <StatusFilterDropdown
            options={statusFilterOptions}
            selectedOptionId={sortOption}
            onChange={onSortChange}
          />
        </div>
      </div>

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
          {apps.map((app, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => (onAppClick ? onAppClick(app) : navigate(`/appId/${app.appId}`))}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-gray-900">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const logoUrl = app.logo && app.logo.length >= 10 ? app.logo : null;
                      return logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={`${app.name} logo`}
                          className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                          onError={(e) => {
                            // Show fallback logo.svg if logo fails to load
                            e.currentTarget.src = '/logo.svg';
                          }}
                        />
                      ) : (
                        <img
                          src="/logo.svg"
                          alt="Vincent logo"
                          className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                        />
                      );
                    })()}
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

export function ToolsList({ tools, isLoading, error, onCreateClick }: ToolsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-4">Loading tools...</p>
      </div>
    );
  }

  if (error) {
    return <StatusMessage message={`Failed to load your tools: ${error}`} type="error" />;
  }

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
          {tools.map((tool: any, index: number) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
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
                      <span className="font-medium">Version:</span> {tool.currentVersion || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Owner:</span>{' '}
                      {truncateAddress(tool.authorWalletAddress)}
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

export function PoliciesList({ policies, isLoading, error, onCreateClick }: PoliciesListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-4">Loading policies...</p>
      </div>
    );
  }

  if (error) {
    return <StatusMessage message={`Failed to load your policies: ${error}`} type="error" />;
  }

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
          {policies.map((policy: any, index: number) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
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
                      <span className="font-medium">Version:</span> {policy.currentVersion || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Owner:</span>{' '}
                      {truncateAddress(policy.authorWalletAddress)}
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
