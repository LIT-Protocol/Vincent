import { App } from '@/types/developer-dashboard/appTypes';
import { Logo } from '@/components/shared/ui/Logo';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { ExternalLink, Shield, TriangleAlert, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import { getAppVersionStatus } from '@/utils/user-dashboard/getAppVersionStatus';

interface AppPermissionDashboardHeaderProps {
  app: App;
  permittedVersion: string;
  appVersionsMap?: Record<string, any[]>;
}

export function AppPermissionDashboardHeader({
  app,
  permittedVersion,
  appVersionsMap = {},
}: AppPermissionDashboardHeaderProps) {
  const navigate = useNavigate();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const versionStatus = useMemo(
    () =>
      getAppVersionStatus({
        app,
        permittedVersion,
        appVersionsMap,
        includeDetailText: true,
      }),
    [app, permittedVersion, appVersionsMap],
  );

  const isDescriptionLong = app.description && app.description.length > 200;

  return (
    <>
      <Breadcrumb
        items={[{ label: 'Apps', onClick: () => navigate('/user/apps') }, { label: app.name }]}
      />

      {/* Main Header Card */}
      <div
        className={`backdrop-blur-xl ${theme.mainCard} border ${theme.mainCardBorder} rounded-lg p-3 sm:p-4 lg:p-6`}
      >
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Top Section: App Info and Actions */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className={`p-2 sm:p-2.5 lg:p-3 rounded-xl sm:rounded-2xl ${theme.iconBg} border ${theme.iconBorder} flex-shrink-0`}
              >
                <Logo
                  logo={app.logo}
                  alt={app.name}
                  className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1
                  className={`text-xl sm:text-xl lg:text-2xl font-bold ${theme.text} break-words`}
                  style={fonts.heading}
                >
                  {app.name}
                </h1>
                {app.description && (
                  <>
                    <p
                      className={`text-xs sm:text-sm ${theme.textMuted} mt-0.5 sm:mt-1 break-words ${!isDescriptionExpanded && isDescriptionLong ? 'line-clamp-3' : ''}`}
                      style={{ ...fonts.body, wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                    >
                      {app.description}
                    </p>
                    {isDescriptionLong && (
                      <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className={`mt-1 text-xs font-medium flex items-center gap-1 ${theme.textMuted} hover:${theme.text} transition-colors duration-300`}
                        style={fonts.heading}
                      >
                        {isDescriptionExpanded ? (
                          <>
                            Show less <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            Show more <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2 flex-shrink-0">
              <button
                onClick={() => navigate(`/user/appId/${app.appId}/wallet`)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors border ${theme.cardBorder} bg-white dark:bg-gray-950 hover:${theme.itemHoverBg}`}
                style={{
                  ...fonts.heading,
                  color: theme.brandOrange,
                }}
              >
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">Withdraw</span>
              </button>
              {app.appUserUrl && (
                <a
                  href={app.appUserUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors border ${theme.cardBorder} bg-white dark:bg-gray-950 hover:${theme.itemHoverBg}`}
                  style={{
                    ...fonts.heading,
                    color: theme.brandOrange,
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-medium">Open App</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div
        className={`backdrop-blur-xl ${theme.mainCard} border ${theme.mainCardBorder} rounded-lg p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className={`text-base sm:text-lg font-semibold ${theme.text}`} style={fonts.heading}>
            Status
          </h2>
          <span className={`text-sm`} style={{ ...fonts.heading, color: theme.brandOrange }}>
            - v{permittedVersion}
            {versionStatus.hasVersionMismatch && versionStatus.activeVersion && (
              <span className={`ml-1 opacity-75 ${theme.textMuted}`}>
                → v{versionStatus.activeVersion}
              </span>
            )}
          </span>
        </div>
        {versionStatus.warningType === 'yellow' ? (
          <button
            onClick={() => navigate(`/user/appId/${app.appId}/update-version`)}
            className={`backdrop-blur-xl ${theme.itemBg} border ${theme.cardBorder} hover:border-orange-500 rounded-lg p-2.5 sm:p-3 lg:p-4 hover:${theme.itemHoverBg} transition-all w-full text-left`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-lg ${versionStatus.bgColor} flex-shrink-0`}>
                <TriangleAlert className={`w-4 h-4 sm:w-5 sm:h-5 ${versionStatus.statusColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold ${versionStatus.statusColor} leading-tight flex items-center gap-1.5`}
                  style={fonts.heading}
                >
                  {versionStatus.statusText}
                  <span className="text-lg relative -top-1">→</span>
                </p>
                <p
                  className={`text-[10px] sm:text-xs ${theme.textMuted} mt-0.5 leading-tight line-clamp-2`}
                  style={fonts.body}
                  title={versionStatus.detailText}
                >
                  {versionStatus.detailText}
                </p>
              </div>
            </div>
          </button>
        ) : (
          <div
            className={`backdrop-blur-xl ${theme.itemBg} border ${theme.cardBorder} rounded-lg p-2.5 sm:p-3 lg:p-4`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-lg ${versionStatus.bgColor} flex-shrink-0`}>
                {versionStatus.warningType ? (
                  <TriangleAlert className={`w-4 h-4 sm:w-5 sm:h-5 ${versionStatus.statusColor}`} />
                ) : (
                  <Shield className={`w-4 h-4 sm:w-5 sm:h-5 ${versionStatus.statusColor}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold ${versionStatus.statusColor} leading-tight mt-0.5`}
                  style={fonts.heading}
                >
                  {versionStatus.statusText}
                </p>
                {versionStatus.warningType && (
                  <p
                    className={`text-[10px] sm:text-xs ${theme.textMuted} mt-0.5 leading-tight line-clamp-2`}
                    style={fonts.body}
                    title={versionStatus.detailText}
                  >
                    {versionStatus.detailText}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
