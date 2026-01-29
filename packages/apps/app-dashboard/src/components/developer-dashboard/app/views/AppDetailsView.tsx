import { useState, useEffect } from 'react';
import { App } from '@/types/developer-dashboard/appTypes';
import { App as ContractApp } from '@lit-protocol/vincent-contracts-sdk';
import { AppDetail } from '@/components/developer-dashboard/ui/AppDetail';
import { Logo } from '@/components/shared/ui/Logo';
import { AppPublishedButtons } from '../wrappers/ui/AppPublishedButtons';
import { Copy, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { theme, fonts } from '@/lib/themeClasses';
import { motion } from 'framer-motion';

interface AppDetailsViewProps {
  selectedApp: App;
  onOpenMutation: (mutationType: string) => void;
  blockchainAppData: ContractApp | null;
  blockchainAppLoading: boolean;
  refetchBlockchainData: () => void;
}

export function AppDetailsView({
  selectedApp,
  onOpenMutation,
  blockchainAppData,
  blockchainAppLoading,
  refetchBlockchainData,
}: AppDetailsViewProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const isPublished = blockchainAppData !== null;

  useEffect(() => {
    setShowContent(true);
  }, []);

  const copyAppId = async () => {
    try {
      await navigator.clipboard.writeText(selectedApp.appId.toString());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy app ID:', err);
    }
  };

  const delegateeAddresses = blockchainAppData?.delegateeAddresses || [];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="w-full space-y-6 relative z-10"
      >
        {/* Header Card with App Info */}
        <div
          className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
        >
          {/* Status Banner - only show if blockchain data has finished loading */}
          {!blockchainAppLoading && !isPublished && selectedApp.activeVersion && (
            <div className={`flex items-center gap-3 p-3 border-b ${theme.warningBg}`}>
              <AlertCircle className={`h-4 w-4 flex-shrink-0 ${theme.warningText}`} />
              <span className={`text-xs ${theme.warningText}`} style={fonts.body}>
                App version {selectedApp.activeVersion} is not published. Users cannot grant
                permissions.{' '}
                <Link
                  to={`/developer/apps/appId/${selectedApp.appId}/version/${selectedApp.activeVersion}`}
                  className="underline hover:no-underline font-medium"
                  style={{ color: theme.brandOrange }}
                >
                  Publish now
                </Link>
              </span>
            </div>
          )}
          {!blockchainAppLoading && !isPublished && !selectedApp.activeVersion && (
            <div className={`flex items-center gap-3 p-3 border-b ${theme.warningBg}`}>
              <AlertCircle className={`h-4 w-4 flex-shrink-0 ${theme.warningText}`} />
              <span className={`text-xs ${theme.warningText}`} style={fonts.body}>
                App version 1 is not published. Users cannot grant permissions.{' '}
                <Link
                  to={`/developer/apps/appId/${selectedApp.appId}/version/1`}
                  className="underline hover:no-underline font-medium"
                  style={{ color: theme.brandOrange }}
                >
                  Publish now
                </Link>
              </span>
            </div>
          )}

          <div className="p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className={`text-3xl font-bold ${theme.text}`} style={fonts.heading}>
                    {selectedApp.name}
                  </h1>
                </div>

                {/* App ID with Copy Button */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-sm ${theme.textMuted}`} style={fonts.body}>
                    App ID:
                  </span>
                  <code
                    className={`text-sm font-mono ${theme.itemBg} px-2 py-1 rounded ${theme.text}`}
                    style={fonts.body}
                  >
                    {selectedApp.appId}
                  </code>
                  <button
                    onClick={copyAppId}
                    className={`p-1 rounded transition-colors ${theme.itemHoverBg}`}
                    style={{ color: theme.brandOrange }}
                    title={copySuccess ? 'Copied!' : 'Copy App ID'}
                  >
                    <Copy
                      className={`h-4 w-4 ${copySuccess ? 'text-green-600 dark:text-green-400' : ''}`}
                      style={copySuccess ? {} : { color: theme.brandOrange }}
                    />
                  </button>
                  {copySuccess && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Copied!
                    </span>
                  )}
                </div>

                <p className={`${theme.textMuted} leading-relaxed`} style={fonts.body}>
                  {selectedApp.description}
                </p>
              </div>

              {/* Logo */}
              <div className="flex-shrink-0">
                {selectedApp.logo && selectedApp.logo.length >= 10 ? (
                  <Logo
                    logo={selectedApp.logo}
                    alt="App logo"
                    className={`w-24 h-24 object-contain rounded-lg border ${theme.mainCardBorder} shadow-sm`}
                  />
                ) : (
                  <div
                    className={`w-24 h-24 rounded-lg border ${theme.mainCardBorder} flex items-center justify-center ${theme.itemBg}`}
                  >
                    <img src="/logo.svg" alt="Vincent logo" className="w-12 h-12 opacity-50" />
                  </div>
                )}
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
              Manage your application
            </p>
          </div>
          <div className="p-6">
            {blockchainAppData && (
              <AppPublishedButtons
                appData={selectedApp}
                appBlockchainData={blockchainAppData}
                onOpenMutation={onOpenMutation}
                refetchBlockchainData={refetchBlockchainData}
              />
            )}
          </div>
        </div>

        {/* App Information Card */}
        <div
          className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
        >
          <div className={`p-6 border-b ${theme.cardBorder}`}>
            <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
              App Information
            </h3>
            <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
              Application details
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <AppDetail label="App ID">
                <span className={`${theme.text} text-sm`} style={fonts.body}>
                  {selectedApp.appId}
                </span>
              </AppDetail>

              <AppDetail label="Active Version">
                <span className={`${theme.text} text-sm`} style={fonts.body}>
                  {selectedApp.activeVersion || 'Unregistered'}
                </span>
              </AppDetail>

              {selectedApp.contactEmail && (
                <AppDetail label="Contact Email">
                  <span className={`${theme.text} text-sm`} style={fonts.body}>
                    {selectedApp.contactEmail}
                  </span>
                </AppDetail>
              )}

              {selectedApp.appUrl && (
                <AppDetail label="App URL">
                  <a
                    href={selectedApp.appUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline"
                    style={{ color: theme.brandOrange, ...fonts.body }}
                  >
                    {selectedApp.appUrl}
                  </a>
                </AppDetail>
              )}

              {delegateeAddresses && delegateeAddresses.length > 0 && (
                <AppDetail label="Delegatee Addresses">
                  <div className="space-y-1">
                    {delegateeAddresses.map((address) => (
                      <div key={address}>
                        <span
                          className={`inline-block ${theme.itemBg} px-2 py-1 rounded text-sm ${theme.textMuted}`}
                          style={fonts.body}
                        >
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
                    className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
                      selectedApp.deploymentStatus === 'prod'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : selectedApp.deploymentStatus === 'test'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          : `${theme.itemBg} ${theme.textMuted}`
                    }`}
                    style={fonts.heading}
                  >
                    {selectedApp.deploymentStatus.toUpperCase()}
                  </span>
                </AppDetail>
              )}

              <AppDetail label="Created At">
                <span className={`${theme.text} text-sm`} style={fonts.body}>
                  {new Date(selectedApp.createdAt).toLocaleString()}
                </span>
              </AppDetail>

              <AppDetail label="Updated At" isLast>
                <span className={`${theme.text} text-sm`} style={fonts.body}>
                  {new Date(selectedApp.updatedAt).toLocaleString()}
                </span>
              </AppDetail>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
