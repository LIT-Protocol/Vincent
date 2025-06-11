import { useNavigate, Link } from 'react-router-dom';
import { AppDetails } from '@/types';
import { AppCard } from '../../app-dashboard/ui/AppCard';

export interface UserAppsViewProps {
  apps: AppDetails[];
  isLoading: boolean;
  error?: string;
}

export default function UserAppsView({ apps, isLoading, error }: UserAppsViewProps) {
  const navigate = useNavigate();

  const handleCardClick = (appId: string) => {
    navigate(`/user/appId/${appId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-4">Loading your apps...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : apps.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-12 text-center bg-gray-50">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">No Connected Apps</h2>
          <p className="text-gray-600 text-lg mb-6">
            You haven't connected any applications yet. When you authorize apps to access your
            Vincent identity, they'll appear here.
          </p>
          <p className="text-gray-500">
            Check out the <Link to="/user/explorer">Explorer</Link> to find apps that support
            Vincent authentication.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Connected Apps</h2>
            <p className="text-gray-600">
              {apps.length} {apps.length === 1 ? 'application' : 'applications'} connected to your
              Vincent identity
            </p>
          </div>

          <div className="space-y-4">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} onClick={handleCardClick} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
