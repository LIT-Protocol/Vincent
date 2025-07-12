import { Power, PowerOff } from 'lucide-react';
import { VersionDetails } from '@/components/developer-dashboard/app/views/AppVersionDetails';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { AppVersionPublishedButtons } from '../wrappers/ui/AppVersionPublishedButtons';
import { AppVersionUnpublishedButtons } from '../wrappers/ui/AppVersionUnpublishedButtons';
import { App, AppVersion, AppVersionTool } from '@/types/developer-dashboard/appTypes';
import {
  App as ContractApp,
  AppVersion as ContractAppVersion,
} from '@lit-protocol/vincent-contracts-sdk';

interface AppVersionDetailViewProps {
  app: App;
  versionData: AppVersion;
  versionTools: AppVersionTool[];
  blockchainAppVersion: ContractAppVersion | null;
  blockchainAppData: ContractApp | null;
  refetchBlockchainAppVersionData: () => void;
  isAppRegistered: boolean;
}

export function AppVersionDetailView({
  app,
  versionData,
  versionTools,
  blockchainAppVersion,
  blockchainAppData,
  refetchBlockchainAppVersionData,
  isAppRegistered,
}: AppVersionDetailViewProps) {
  const isPublished = blockchainAppVersion !== null;
  const isAppDeleted = blockchainAppData?.isDeleted;
  const isVersionEnabled = versionData?.enabled ?? false;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Version {versionData.version}</h1>
          <p className="text-gray-600 mt-2">View and manage this version of your application</p>
        </div>
      </div>

      {/* Publish Status Message */}
      {isPublished && (
        <StatusMessage
          message="This app version registered in the on-chain Vincent Registry."
          type="info"
        />
      )}

      {/* Version Management Card */}
      <div className="bg-white border rounded-lg">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Version Management</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Status:</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  isVersionEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {isVersionEnabled ? (
                  <Power className="h-3 w-3" />
                ) : (
                  <PowerOff className="h-3 w-3" />
                )}
                {isVersionEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-3">
          {isPublished && !isAppDeleted ? (
            <AppVersionPublishedButtons
              appId={versionData.appId}
              versionId={versionData.version}
              appVersionData={blockchainAppVersion}
              refetchBlockchainAppVersionData={refetchBlockchainAppVersionData}
            />
          ) : isPublished && isAppDeleted ? (
            <StatusMessage
              message="This app is deleted in the on-chain Vincent Registry. Please undelete the app to enable version modification."
              type="info"
            />
          ) : (
            <AppVersionUnpublishedButtons
              appId={versionData.appId}
              versionId={versionData.version}
              isVersionEnabled={isVersionEnabled}
              isAppRegistered={isAppRegistered}
            />
          )}
        </div>
      </div>

      {/* Version Details */}
      <VersionDetails
        version={versionData.version}
        appName={app.name}
        versionData={versionData}
        tools={versionTools || []}
      />
    </div>
  );
}
