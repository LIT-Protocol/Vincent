import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppDetailsState } from '../../../pages/appId/types';
import { getDeploymentStatusName } from '../../../pages/appId/utils/appDetailsUtils';

interface AppInfoSectionProps {
  app: AppDetailsState;
}

/**
 * Component to display app details
 */
export const AppInfoSection: React.FC<AppInfoSectionProps> = ({ app }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{app.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-600 mb-4">{app.description}</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-sm font-medium text-gray-700">App ID:</div>
            <div className="text-base">{app.id}</div>
          </div>

          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-sm font-medium text-gray-700">Status:</div>
            <div className="text-base flex items-center">
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  app.deploymentStatus === 0
                    ? 'bg-amber-100 text-amber-800'
                    : app.deploymentStatus === 1
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                }`}
              >
                {getDeploymentStatusName(app.deploymentStatus)}
              </span>
              {Boolean(app.isDeleted) && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                  Deleted
                </span>
              )}
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-sm font-medium text-gray-700">Latest Version:</div>
            <div className="text-base">{String(app.latestVersion)}</div>
          </div>

          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-sm font-medium text-gray-700">Your Permitted Version:</div>
            <div className="text-base">
              {app.permittedVersion !== null ? (
                app.permittedVersion
              ) : (
                <span className="text-gray-500 italic">Not permitted</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
