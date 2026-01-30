import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { useBlockchainAppVersions } from '@/hooks/useBlockchainAppVersions';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { theme, fonts } from '@/lib/themeClasses';
import { CheckCircle, XCircle, Plus, Layers } from 'lucide-react';
import { AppVersion } from '@lit-protocol/vincent-contracts-sdk';

interface VersionCardProps {
  version: AppVersion;
  onClick: () => void;
}

function VersionCard({ version, onClick }: VersionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl p-6 text-left transition-all hover:shadow-lg`}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.brandOrange;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '';
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold ${theme.text} text-lg`} style={fonts.heading}>
          Version {version.version}
        </h3>
        <div
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
            version.enabled
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {version.enabled ? (
            <>
              <CheckCircle className="w-3 h-3" />
              Enabled
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3" />
              Disabled
            </>
          )}
        </div>
      </div>
      <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
        {version.abilities.length} {version.abilities.length === 1 ? 'ability' : 'abilities'}{' '}
        configured
      </p>
    </button>
  );
}

export function AppVersionsWrapper() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [showContent] = useState(true);

  // Fetch app from registry for name/metadata
  const { data: app, isLoading: appLoading } = vincentApiClient.useGetAppQuery(
    { appId: Number(appId) },
    { skip: !appId },
  );

  // Fetch versions from on-chain
  const {
    data: chainData,
    error: chainError,
    isLoading: chainLoading,
  } = useBlockchainAppVersions(Number(appId));

  const isLoading = appLoading || chainLoading;

  if (isLoading) {
    return <Loading />;
  }

  if (chainError) {
    return (
      <>
        <Breadcrumb
          items={[
            { label: 'Apps', onClick: () => navigate('/developer/apps') },
            { label: `App ${appId}` },
          ]}
        />
        <StatusMessage message={chainError} type="error" />
      </>
    );
  }

  const handleVersionClick = (version: number) => {
    navigate(`/developer/apps/appId/${appId}/version/${version}`);
  };

  const handleCreateVersion = () => {
    navigate(`/developer/apps/appId/${appId}/new-version`);
  };

  // Separate enabled and disabled versions
  const enabledVersions = chainData?.versions.filter((v) => v.enabled) || [];
  const disabledVersions = chainData?.versions.filter((v) => !v.enabled) || [];

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Apps', onClick: () => navigate('/developer/apps') },
          {
            label: app?.name || `App ${appId}`,
            onClick: () => navigate(`/developer/apps/appId/${appId}`),
          },
          { label: 'Versions' },
        ]}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="w-full space-y-8"
      >
        {!chainData || chainData.versions.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px] w-full">
            <div className="text-center max-w-md mx-auto px-6">
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${theme.itemBg} border ${theme.cardBorder} mb-6`}
              >
                <Layers className={`w-8 h-8 ${theme.textMuted}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${theme.text}`} style={fonts.heading}>
                No Versions Yet
              </h3>
              <p className={`text-sm ${theme.textMuted} leading-relaxed mb-6`} style={fonts.body}>
                Create your first version to get started.
              </p>
              <button
                onClick={handleCreateVersion}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors inline-flex items-center gap-2"
                style={{ backgroundColor: theme.brandOrange, ...fonts.heading }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.brandOrange;
                }}
              >
                <Plus className="h-4 w-4" />
                Create Version
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Enabled Versions Section */}
            {enabledVersions.length > 0 && (
              <div>
                <h3 className={`text-lg font-semibold ${theme.text} mb-4`} style={fonts.heading}>
                  Enabled Versions
                </h3>
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {enabledVersions
                    .slice()
                    .sort((a, b) => b.version - a.version)
                    .map((version) => (
                      <VersionCard
                        key={version.version}
                        version={version}
                        onClick={() => handleVersionClick(version.version)}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Disabled Versions Section */}
            {disabledVersions.length > 0 && (
              <div>
                <h3 className={`text-lg font-semibold ${theme.text} mb-4`} style={fonts.heading}>
                  Disabled Versions
                </h3>
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {disabledVersions
                    .slice()
                    .sort((a, b) => b.version - a.version)
                    .map((version) => (
                      <VersionCard
                        key={version.version}
                        version={version}
                        onClick={() => handleVersionClick(version.version)}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Divider and Create Version CTA */}
            <div className="pt-8 border-t border-gray-200 dark:border-white/10">
              <div className="flex flex-col items-center justify-center py-6">
                <h3 className={`text-lg font-semibold ${theme.text} mb-4`} style={fonts.heading}>
                  Ready to create another version?
                </h3>
                <button
                  onClick={handleCreateVersion}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors inline-flex items-center gap-2"
                  style={{ backgroundColor: theme.brandOrange, ...fonts.heading }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.brandOrange;
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create Version
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}
