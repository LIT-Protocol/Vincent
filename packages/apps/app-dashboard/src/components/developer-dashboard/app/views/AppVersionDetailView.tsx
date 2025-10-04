import { Power, PowerOff } from 'lucide-react';
import { VersionDetails } from '@/components/developer-dashboard/app/views/AppVersionDetails';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { AppVersionPublishedButtons } from '../wrappers/ui/AppVersionPublishedButtons';
import { AppVersionUnpublishedButtons } from '../wrappers/ui/AppVersionUnpublishedButtons';
import { AppVersionDeletedButtons } from '../wrappers/ui/AppVersionDeletedButtons';
import { App, AppVersion, AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import {
  App as ContractApp,
  AppVersion as ContractAppVersion,
} from '@lit-protocol/vincent-contracts-sdk';

interface AppVersionDetailViewProps {
  app: App;
  versionData: AppVersion;
  versionAbilities: AppVersionAbility[];
  blockchainAppVersion: ContractAppVersion | null;
  blockchainAppData: ContractApp | null;
  refetchBlockchainAppVersionData: () => void;
}

export function AppVersionDetailView({
  app,
  versionData,
  versionAbilities,
  blockchainAppVersion,
  blockchainAppData,
  refetchBlockchainAppVersionData,
}: AppVersionDetailViewProps) {
  const isAppPublished = blockchainAppData !== null;
  const isVersionPublished = blockchainAppVersion !== null;
  const isAppDeletedOnChain = blockchainAppData?.isDeleted;
  const isAppVersionDeletedRegistry = versionData.isDeleted;
  const isVersionEnabledRegistry = versionData.enabled;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">
            Version {versionData.version}
          </h1>
          <p className="text-gray-600 dark:text-white/60 mt-2">
            View and manage this version of your application
          </p>
        </div>
      </div>

      {/* Publish Status Messages */}
      {isVersionPublished && (
        <StatusMessage message="This app version is registered on-chain." type="info" />
      )}
      {!app.activeVersion && (
        <StatusMessage
          message="Your App version 1 needs to be published. Until it is, users cannot grant permissions. To publish, click the `Publish App Version` button on this page."
          type="warning"
        />
      )}
      {!isVersionPublished && app.activeVersion === versionData.version && (
        <StatusMessage
          message="This is your app's active version but it's not published on-chain. Users cannot grant permissions until you publish this version on-chain."
          type="warning"
        />
      )}

      {/* Version Management Card */}
      <div className="bg-white dark:bg-neutral-800 border dark:border-white/10 rounded-lg">
        <div className="p-6 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-neutral-800 dark:text-white">
                Version Management
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-white/40">Registry Status:</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  isVersionEnabledRegistry
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                }`}
              >
                {isVersionEnabledRegistry ? (
                  <>
                    <Power className="h-3 w-3" />
                    Enabled
                  </>
                ) : (
                  <>
                    <PowerOff className="h-3 w-3" />
                    Disabled
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-3">
          {isVersionPublished && !isAppDeletedOnChain && !isAppVersionDeletedRegistry ? (
            <AppVersionPublishedButtons
              appId={versionData.appId}
              versionId={versionData.version}
              appVersionData={versionData}
              appVersionBlockchainData={blockchainAppVersion}
              refetchBlockchainAppVersionData={refetchBlockchainAppVersionData}
            />
          ) : isVersionPublished && isAppDeletedOnChain ? (
            <StatusMessage
              message="This app is deleted on-chain. Please undelete the app to enable version modification."
              type="info"
            />
          ) : isAppVersionDeletedRegistry ? (
            <AppVersionDeletedButtons appVersion={versionData} />
          ) : (
            <AppVersionUnpublishedButtons
              appId={versionData.appId}
              versionId={versionData.version}
              isVersionEnabled={isVersionEnabledRegistry}
              isAppPublished={isAppPublished}
            />
          )}
        </div>
      </div>

      {/* Version Details */}
      <VersionDetails
        version={versionData.version}
        appName={app.name}
        versionData={versionData}
        abilities={versionAbilities || []}
      />
    </div>
  );
}
