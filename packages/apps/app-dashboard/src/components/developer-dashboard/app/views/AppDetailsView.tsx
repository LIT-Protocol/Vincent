import { useState } from 'react';
import { App } from '@/types/developer-dashboard/appTypes';
import { App as ContractApp } from '@lit-protocol/vincent-contracts-sdk';
import { AppDetail } from '@/components/developer-dashboard/ui/AppDetail';
import { Logo } from '@/components/shared/ui/Logo';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { AppPublishedButtons } from '../wrappers/ui/AppPublishedButtons';
import { AppUnpublishedButtons } from '../wrappers/ui/AppUnpublishedButtons';
import { UndeleteAppButton } from '../wrappers/ui/UndeleteAppButton';
import { CheckCircle, XCircle, Share, Copy } from 'lucide-react';
import { ConnectPageModal } from '../../ui/ConnectPageModal';
import { Link } from 'react-router-dom';

interface AppDetailsViewProps {
  selectedApp: App;
  onOpenMutation: (mutationType: string) => void;
  blockchainAppData: ContractApp | null;
  refetchBlockchainData: () => void;
}

export function AppDetailsView({
  selectedApp,
  onOpenMutation,
  blockchainAppData,
  refetchBlockchainData,
}: AppDetailsViewProps) {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const isPublished = blockchainAppData !== null;
  const isAppDeletedRegistry = selectedApp.isDeleted;

  const copyAppId = async () => {
    try {
      await navigator.clipboard.writeText(selectedApp.appId.toString());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy app ID:', err);
    }
  };

  const delegateeAddresses = isPublished
    ? blockchainAppData.delegateeAddresses
    : selectedApp.delegateeAddresses;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">
                {selectedApp.name}
              </h1>
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors"
                title="Share connect page"
              >
                <Share className="h-5 w-5" />
              </button>
            </div>

            {/* App ID with Copy Button */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600 dark:text-white/60">App ID:</span>
              <code className="text-sm font-mono bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-neutral-800 dark:text-white">
                {selectedApp.appId}
              </code>
              <button
                onClick={copyAppId}
                className="p-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded transition-colors"
                title={copySuccess ? 'Copied!' : 'Copy App ID'}
              >
                <Copy
                  className={`h-4 w-4 ${copySuccess ? 'text-green-600 dark:text-green-400' : 'text-orange-600'}`}
                />
              </button>
              {copySuccess && (
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Copied!
                </span>
              )}
            </div>

            <p className="text-gray-600 dark:text-white/60 mt-3">{selectedApp.description}</p>
          </div>
          <div className="ml-6 flex-shrink-0">
            {selectedApp.logo && selectedApp.logo.length >= 10 ? (
              <Logo
                logo={selectedApp.logo}
                alt="App logo"
                className="max-w-24 max-h-24 object-contain rounded-lg border dark:border-white/10 shadow-sm bg-gray-50 dark:bg-white/5"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-lg border dark:border-white/10 flex items-center justify-center">
                <img src="/logo.svg" alt="Vincent logo" className="w-8 h-8 opacity-50" />
              </div>
            )}
          </div>
        </div>

        {/* Publish Status Messages */}
        {isPublished && <StatusMessage message="This app is registered on-chain." type="info" />}
        {!isPublished && selectedApp.activeVersion && (
          <div className="flex items-center p-3 mb-4 rounded-lg text-sm leading-normal w-full transition-all min-h-[48px] opacity-100 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700/30">
            <span className="ml-3 transition-opacity">
              Your active App version ({selectedApp.activeVersion}) is not published, and users
              cannot grant permissions to your App. Go{' '}
              <Link
                to={`/developer/appId/${selectedApp.appId}/version/${selectedApp.activeVersion}`}
                className="underline hover:no-underline font-medium"
              >
                here
              </Link>{' '}
              to publish the App version on-chain.
            </span>
          </div>
        )}
        {!selectedApp.activeVersion && (
          <div className="flex items-center p-3 mb-4 rounded-lg text-sm leading-normal w-full transition-all min-h-[48px] opacity-100 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700/30">
            <span className="ml-3 transition-opacity">
              Your App version 1 is not published, and users cannot grant permissions to your App.
              Go{' '}
              <Link
                to={`/developer/appId/${selectedApp.appId}/version/1`}
                className="underline hover:no-underline font-medium"
              >
                here
              </Link>{' '}
              to publish the App version on-chain.
            </span>
          </div>
        )}

        {/* App Management Actions */}
        <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-white/10 rounded-lg">
          <div className="p-6 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-neutral-800 dark:text-white">
                  App Management
                </h3>
                <p className="text-gray-600 dark:text-white/60 text-sm mt-1">
                  Manage your application settings
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-white/40">Registry Status:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    !isAppDeletedRegistry
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                  }`}
                >
                  {!isAppDeletedRegistry ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      Deleted
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
          <div className="p-6">
            {isPublished ? (
              <AppPublishedButtons
                appData={selectedApp}
                appBlockchainData={blockchainAppData}
                onOpenMutation={onOpenMutation}
                refetchBlockchainData={refetchBlockchainData}
              />
            ) : isAppDeletedRegistry ? (
              <UndeleteAppButton app={selectedApp} />
            ) : (
              <AppUnpublishedButtons onOpenMutation={onOpenMutation} />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-white/10 rounded-lg">
            <div className="p-6 border-b border-gray-100 dark:border-white/10">
              <h3 className="text-lg font-medium text-neutral-800 dark:text-white">
                App Information
              </h3>
              <p className="text-gray-600 dark:text-white/60 text-sm mt-1">Application details</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <AppDetail label="App ID">
                  <span className="text-neutral-800 dark:text-white text-sm">
                    {selectedApp.appId}
                  </span>
                </AppDetail>

                <AppDetail label="Active Version">
                  <span className="text-neutral-800 dark:text-white text-sm">
                    {selectedApp.activeVersion}
                  </span>
                </AppDetail>

                {selectedApp.contactEmail && (
                  <AppDetail label="Contact Email">
                    <span className="text-neutral-800 dark:text-white text-sm">
                      {selectedApp.contactEmail}
                    </span>
                  </AppDetail>
                )}

                {selectedApp.appUserUrl && (
                  <AppDetail label="App User URL">
                    <a
                      href={selectedApp.appUserUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 dark:text-orange-400 hover:underline text-sm"
                    >
                      {selectedApp.appUserUrl}
                    </a>
                  </AppDetail>
                )}

                {selectedApp.redirectUris && selectedApp.redirectUris.length > 0 && (
                  <AppDetail label="Redirect URIs">
                    <div className="space-y-1">
                      {selectedApp.redirectUris.map((uri) => (
                        <div key={uri}>
                          <span className="inline-block bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/70 px-2 py-1 rounded text-sm">
                            {uri}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AppDetail>
                )}

                {delegateeAddresses && delegateeAddresses.length > 0 && (
                  <AppDetail label="Delegatee Addresses">
                    <div className="space-y-1">
                      {delegateeAddresses.map((address) => (
                        <div key={address}>
                          <span className="inline-block bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/70 px-2 py-1 rounded text-sm">
                            {address}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AppDetail>
                )}

                {selectedApp.deploymentStatus && (
                  <AppDetail label="Deployment Status">
                    <span
                      className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                        selectedApp.deploymentStatus === 'prod'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                          : selectedApp.deploymentStatus === 'test'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                            : 'bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {selectedApp.deploymentStatus.toUpperCase()}
                    </span>
                  </AppDetail>
                )}

                <AppDetail label="Created At">
                  <span className="text-neutral-800 dark:text-white text-sm">
                    {selectedApp.createdAt}
                  </span>
                </AppDetail>

                <AppDetail label="Updated At" isLast>
                  <span className="text-neutral-800 dark:text-white text-sm">
                    {selectedApp.updatedAt}
                  </span>
                </AppDetail>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConnectPageModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        appId={selectedApp.appId}
        redirectUris={selectedApp.redirectUris || []}
      />
    </>
  );
}
