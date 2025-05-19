import { Info } from 'lucide-react';
import { AppDetails } from '@/types';

export interface AppCardProps {
  app: AppDetails;
  onClick: (appId: string) => void;
}

export function AppCard({ app, onClick }: AppCardProps) {
  return (
    <div
      onClick={() => onClick(app.id)}
      className="bg-white rounded-xl border shadow-sm p-6 cursor-pointer transition-all hover:shadow-md"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold">{app.name}</h3>
        <div className="flex items-center gap-2">
          {app.showInfo && (
            <div className="relative group">
              <Info className="h-4 w-4 text-amber-500" />
              <div className="absolute right-0 z-10 invisible group-hover:visible bg-white p-2 rounded shadow-lg border border-gray-200 w-64 text-xs text-gray-700 mt-1">
                {app.infoMessage}
              </div>
            </div>
          )}
          {app.version && (
            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
              v{app.version}
            </span>
          )}
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 h-10 line-clamp-2">
        {app.description || 'No description provided'}
      </p>

      <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-100">
        <div className="flex items-center">
          <span className="text-xs font-medium mr-1">Status:</span>
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              app.deploymentStatus === 0
                ? 'bg-amber-100 text-amber-800'
                : app.deploymentStatus === 1
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
            }`}
          >
            {app.deploymentStatus === 0 ? 'DEV' : app.deploymentStatus === 1 ? 'TEST' : 'PROD'}
          </span>
        </div>
      </div>
    </div>
  );
}
