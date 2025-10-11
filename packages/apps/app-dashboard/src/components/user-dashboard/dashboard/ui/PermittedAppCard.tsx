import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { App, AppVersion } from '@/types/developer-dashboard/appTypes';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Logo } from '@/components/shared/ui/Logo';
import { Settings, RefreshCw, Shield, TriangleAlert, Wallet } from 'lucide-react';
import { AgentAppPermission } from '@/utils/user-dashboard/getAgentPkps';
import { getAppVersionStatus } from '@/utils/user-dashboard/getAppVersionStatus';

type PermittedAppCardProps = {
  app: App;
  permission: AgentAppPermission | undefined;
  isUnpermitted?: boolean;
  index?: number;
  appVersionsMap: Record<string, AppVersion[]>;
};

export function PermittedAppCard({
  app,
  permission,
  isUnpermitted = false,
  index = 0,
  appVersionsMap,
}: PermittedAppCardProps) {
  const navigate = useNavigate();

  const versionStatus = useMemo(
    () =>
      getAppVersionStatus({
        app,
        permittedVersion: permission?.permittedVersion?.toString(),
        appVersionsMap,
      }),
    [app, permission?.permittedVersion, appVersionsMap],
  );

  const handleManageClick = () => {
    if (isUnpermitted) {
      navigate(`/user/appId/${app.appId}/repermit`);
    } else {
      navigate(`/user/appId/${app.appId}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="w-full"
    >
      <Card
        className={`py-0 gap-0 backdrop-blur-xl ${theme.mainCard} border ${theme.cardBorder} ${theme.cardHoverBorder} transition-all duration-200 hover:shadow-lg w-full flex flex-col overflow-hidden`}
      >
        <CardContent className="p-4 flex flex-col gap-3">
          {/* Top section - Logo, Title and Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Logo
                logo={app.logo}
                alt={`${app.name} logo`}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex flex-col justify-center min-w-0 flex-1">
                <h3
                  className={`text-base font-semibold leading-tight ${theme.text}`}
                  style={fonts.heading}
                >
                  {app.name}
                </h3>
                {permission?.permittedVersion && (
                  <span className={`text-sm ${theme.textMuted} leading-tight`}>
                    v{permission.permittedVersion}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bottom section - Status and Buttons grouped together */}
          <div className="flex flex-col gap-2 w-full">
            {/* Status Card */}
            {permission && !isUnpermitted && (
              <div
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}
              >
                <div className={`flex-shrink-0`}>
                  {versionStatus.warningType ? (
                    <TriangleAlert className={`w-4 h-4 ${versionStatus.statusColor}`} />
                  ) : (
                    <Shield className={`w-4 h-4 ${versionStatus.statusColor}`} />
                  )}
                </div>
                <p
                  className={`text-xs font-medium ${versionStatus.statusColor} leading-none mt-0.5`}
                  style={fonts.heading}
                >
                  {versionStatus.statusText}
                </p>
              </div>
            )}

            {/* Access Wallet button for unpermitted apps */}
            {isUnpermitted && (
              <button
                onClick={() => navigate(`/user/appId/${app.appId}/wallet`)}
                className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${theme.cardBorder} bg-white dark:bg-gray-950 hover:${theme.itemHoverBg}`}
                style={{
                  ...fonts.heading,
                  color: theme.brandOrange,
                }}
              >
                <Wallet className="w-4 h-4 flex-shrink-0 -mt-px" />
                <span className="leading-none">Access Wallet</span>
              </button>
            )}

            <button
              onClick={handleManageClick}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isUnpermitted
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100 border border-slate-300 dark:border-slate-600'
                  : 'text-white'
              }`}
              style={
                isUnpermitted
                  ? fonts.heading
                  : {
                      ...fonts.heading,
                      backgroundColor: theme.brandOrange,
                    }
              }
              onMouseEnter={(e) => {
                if (!isUnpermitted) {
                  e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
                }
              }}
              onMouseLeave={(e) => {
                if (!isUnpermitted) {
                  e.currentTarget.style.backgroundColor = theme.brandOrange;
                }
              }}
            >
              {isUnpermitted ? (
                <RefreshCw className="w-4 h-4 flex-shrink-0 -mt-px" />
              ) : (
                <Settings className="w-4 h-4 flex-shrink-0 -mt-px" />
              )}
              <span className="leading-none">{isUnpermitted ? 'Repermit App' : 'Manage App'}</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
