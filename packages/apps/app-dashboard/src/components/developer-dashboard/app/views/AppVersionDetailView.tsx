import { useState, useEffect } from 'react';
import { Power, PowerOff, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  App as ContractApp,
  AppVersion as ContractAppVersion,
} from '@lit-protocol/vincent-contracts-sdk';

import { VersionDetails } from '@/components/developer-dashboard/app/views/AppVersionDetails';
import { AppVersionPublishedButtons } from '../wrappers/ui/AppVersionPublishedButtons';
import { AppVersionUnpublishedButtons } from '../wrappers/ui/AppVersionUnpublishedButtons';
import { AppVersionDeletedButtons } from '../wrappers/ui/AppVersionDeletedButtons';
import { App, AppVersion, AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
interface AppVersionDetailViewProps {
  app: App;
  versionData: AppVersion;
  versionAbilities: AppVersionAbility[];
  blockchainAppVersion: ContractAppVersion | null;
  blockchainAppData: ContractApp | null;
  refetchBlockchainAppVersionData: () => void;
  onOpenMutation: (mutationType: string) => void;
}

export function AppVersionDetailView({
  app,
  versionData,
  versionAbilities,
  blockchainAppVersion,
  blockchainAppData,
  refetchBlockchainAppVersionData,
  onOpenMutation,
}: AppVersionDetailViewProps) {
  const [showContent, setShowContent] = useState(false);
  const isAppPublished = blockchainAppData !== null;
  const isVersionPublished = blockchainAppVersion !== null;
  const isAppDeletedOnChain = blockchainAppData?.isDeleted;
  const isAppVersionDeletedRegistry = versionData.isDeleted;
  const isVersionEnabledRegistry = versionData.enabled;

  useEffect(() => {
    setShowContent(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: showContent ? 1 : 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="w-full space-y-6 relative z-10"
    >
      {/* Header Card */}
      <div
        className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
      >
        {/* Status Banner */}
        {!isVersionPublished && app.activeVersion === versionData.version && (
          <div className={`flex items-center gap-3 p-3 border-b ${theme.warningBg}`}>
            <AlertCircle className={`h-4 w-4 flex-shrink-0 ${theme.warningText}`} />
            <span className={`text-xs ${theme.warningText}`} style={fonts.body}>
              This is your app's active version but it's not published on-chain. Users cannot grant
              permissions until you publish this version.
            </span>
          </div>
        )}
        {!app.activeVersion && versionData.version === 1 && (
          <div className={`flex items-center gap-3 p-3 border-b ${theme.warningBg}`}>
            <AlertCircle className={`h-4 w-4 flex-shrink-0 ${theme.warningText}`} />
            <span className={`text-xs ${theme.warningText}`} style={fonts.body}>
              App version 1 needs to be published. Until it is, users cannot grant permissions.
            </span>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className={`text-3xl font-bold ${theme.text}`} style={fonts.heading}>
                  Version {versionData.version}
                </h1>
                {app.activeVersion === versionData.version && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: `${theme.brandOrange}1A`,
                      color: theme.brandOrange,
                      ...fonts.heading,
                    }}
                  >
                    Active
                  </span>
                )}
              </div>
              <p className={`${theme.textMuted} leading-relaxed`} style={fonts.body}>
                View and manage this version of your application
              </p>
            </div>

            {/* Registry Status Badge */}
            <div className="flex-shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  isVersionEnabledRegistry
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                }`}
                style={fonts.heading}
              >
                {isVersionEnabledRegistry ? (
                  <>
                    <Power className="h-4 w-4" />
                    Enabled
                  </>
                ) : (
                  <>
                    <PowerOff className="h-4 w-4" />
                    Disabled
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Card */}
      <div
        className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
      >
        <div className={`p-6 border-b ${theme.cardBorder}`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
            Actions
          </h3>
          <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
            Manage this version
          </p>
        </div>
        <div className="p-6">
          {isVersionPublished && !isAppDeletedOnChain && !isAppVersionDeletedRegistry ? (
            <AppVersionPublishedButtons
              appId={versionData.appId}
              versionId={versionData.version}
              appVersionData={versionData}
              appVersionBlockchainData={blockchainAppVersion}
              refetchBlockchainAppVersionData={refetchBlockchainAppVersionData}
            />
          ) : isVersionPublished && isAppDeletedOnChain ? (
            <div className={`${theme.itemBg} border ${theme.mainCardBorder} rounded-lg p-4`}>
              <div className="flex items-center gap-3">
                <AlertCircle className={`h-5 w-5 ${theme.textMuted}`} />
                <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
                  This app is deleted on-chain. Please undelete the app to enable version
                  modification.
                </p>
              </div>
            </div>
          ) : isAppVersionDeletedRegistry ? (
            <AppVersionDeletedButtons appVersion={versionData} />
          ) : (
            <AppVersionUnpublishedButtons
              appId={versionData.appId}
              versionId={versionData.version}
              isVersionEnabled={isVersionEnabledRegistry}
              isAppPublished={isAppPublished}
              onOpenMutation={onOpenMutation}
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
    </motion.div>
  );
}
