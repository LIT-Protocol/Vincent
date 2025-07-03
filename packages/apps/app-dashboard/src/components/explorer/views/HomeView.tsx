import { Helmet } from 'react-helmet';
import { App } from '@/types/developer-dashboard/appTypes';
import { AppCard } from '../ui/AppCard';

interface HomeViewProps {
  apps: App[];
}

export function ExplorerHomeView({ apps }: HomeViewProps) {
  return (
    <>
      <Helmet>
        <title>Vincent | Explorer</title>
        <meta name="description" content="Explore all Vincent applications" />
      </Helmet>

      <div className="bg-white min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Explorer</h1>
            <p className="text-gray-600">Discover and connect to Vincent applications</p>
          </div>
          {/* All Applications */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-600">
                {apps.length} application{apps.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="space-y-3">
              {apps.map((app) => (
                <AppCard app={app} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
