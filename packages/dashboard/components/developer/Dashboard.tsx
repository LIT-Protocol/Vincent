import { AppView } from '@/services/types';
import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { StatusFilterDropdown, FilterOption } from '../ui/status-filter-dropdown';
import { useErrorPopup } from '@/providers/error-popup';
import { useRouter } from 'next/navigation';
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

// Deployment status names
const deploymentStatusNames = ['DEV', 'TEST', 'PROD'];

// Define filter options
const statusFilterOptions: FilterOption[] = [
  { id: 'all', label: 'All Applications' },
  { id: 'dev', label: 'DEV' },
  { id: 'test', label: 'TEST' },
  { id: 'prod', label: 'PROD' },
];

export default function DashboardScreen({
  vincentApp,
}: {
  vincentApp: AppView[];
}) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<AppView[]>([]);
  const [isRefetching, setIsRefetching] = useState(false);
  const [sortOption, setSortOption] = useState<string>('all');
  
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

  useEffect(() => {
    if (vincentApp) {
      try {
        setDashboard(vincentApp);
      } catch (error) {
        console.error('Dashboard Error:', error);
        showErrorWithStatus(error instanceof Error ? error.message : 'Error loading dashboard', 'Dashboard Error');
      } finally {
        setIsRefetching(false);
      }
    }
  }, [vincentApp, showErrorWithStatus]);

  // Function to sort applications based on deployment status
  const getFilteredApps = useCallback(() => {
    if (sortOption === 'all') {
      return dashboard;
    }
    
    // Sort based on deployment status (0: DEV, 1: TEST, 2: PROD)
    const statusValue = sortOption === 'dev' ? 0 : sortOption === 'test' ? 1 : 2;
    return dashboard.filter(app => app.deploymentStatus === statusValue);
  }, [dashboard, sortOption]);

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

  const filteredApps = getFilteredApps();

  // Main dashboard view
  return (
    <div className="space-y-6">
      {/* Show status message at the top of the dashboard */}
      {statusMessage && <StatusMessage message={statusMessage} type={statusType} />}
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-black">Dashboard</h1>
        <div className="flex gap-3">
          <StatusFilterDropdown 
            options={statusFilterOptions}
            selectedOptionId={sortOption}
            onChange={setSortOption}
          />
          <Button
            variant="default"
            className="text-black"
            onClick={() => router.push('/create-app')}
          >
            <Plus className="h-4 w-4 mr-2 font-bold text-black" />
            Create App
          </Button>
        </div>
      </div>

      {filteredApps.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4 text-black">
            {dashboard.length === 0 ? "No Apps Yet" : "No apps match the selected filter"}
          </h2>
          <p className="text-gray-600 mb-6">
            {dashboard.length === 0 
              ? "Create your first app to get started with Lit Protocol."
              : "Try a different filter or create a new app."}
          </p>
          <Button
            variant="default"
            className="text-black"
            onClick={() => router.push('/create-app')}
          >
            <Plus className="h-4 w-4 mr-2 font-bold text-black" />
            Create App
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/appId/${app.appId}`)}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-black">
                  <span>{app.appName}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                    {app.deploymentStatus !== undefined && app.deploymentStatus >= 0 && app.deploymentStatus < deploymentStatusNames.length
                      ? deploymentStatusNames[app.deploymentStatus]
                      : 'DEV'}
                  </span>
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
                    {typeof app.managementWallet === 'string' && app.managementWallet ? 
                      `${app.managementWallet.substring(0, 8)}...${app.managementWallet.substring(app.managementWallet.length - 6)}` : 
                      'N/A'
                    }
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
