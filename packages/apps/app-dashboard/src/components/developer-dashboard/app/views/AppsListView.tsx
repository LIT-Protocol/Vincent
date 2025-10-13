import { useNavigate } from 'react-router';
import { Plus, Package } from 'lucide-react';
import { Logo } from '@/components/shared/ui/Logo';
import { App } from '@/types/developer-dashboard/appTypes';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { AppCard } from '../../ui/AppCard';

interface AppsListViewProps {
  apps: App[];
  deletedApps: App[];
}

export function AppsListView({ apps, deletedApps }: AppsListViewProps) {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setShowContent(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: showContent ? 1 : 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="w-full"
    >
      {apps.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px] w-full">
          <div className="text-center max-w-md mx-auto px-6">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${theme.itemBg} border ${theme.cardBorder} mb-6`}
            >
              <Package className={`w-8 h-8 ${theme.textMuted}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${theme.text}`} style={fonts.heading}>
              No Apps Yet
            </h3>
            <p className={`text-sm ${theme.textMuted} leading-relaxed mb-6`} style={fonts.body}>
              Create your first app to get started with Vincent.
            </p>
            <button
              onClick={() => navigate('/developer/apps/create-app')}
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
              Create App
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {apps.map((app) => (
            <AppCard key={app.appId} onClick={() => navigate(`/developer/apps/appId/${app.appId}`)}>
              <div className="flex items-start gap-3 mb-4">
                <Logo
                  logo={app.logo}
                  alt={`${app.name} logo`}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-semibold ${theme.text} truncate text-lg mb-1`}
                    style={fonts.heading}
                  >
                    {app.name}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-1 rounded-md ${theme.itemBg}`}
                      style={fonts.body}
                    >
                      v{app.activeVersion}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-md ${theme.itemBg} uppercase`}
                      style={fonts.body}
                    >
                      {app.deploymentStatus}
                    </span>
                  </div>
                </div>
              </div>
              <p className={`text-sm ${theme.textMuted} line-clamp-2 mb-3`} style={fonts.body}>
                {app.description}
              </p>
              <div className={`text-xs ${theme.textSubtle} font-mono`}>ID: {app.appId}</div>
            </AppCard>
          ))}
        </div>
      )}
      {/* Deleted Apps Section */}
      {deletedApps && deletedApps.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/10">
          <h3 className={`text-lg font-semibold ${theme.textMuted} mb-4`} style={fonts.heading}>
            Deleted Apps
          </h3>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {deletedApps.map((app) => (
              <AppCard
                key={app.appId}
                onClick={() => navigate(`/developer/apps/appId/${app.appId}`)}
                variant="deleted"
              >
                <div className="flex items-start gap-3 mb-4">
                  <Logo
                    logo={app.logo}
                    alt={`${app.name} logo`}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 grayscale"
                  />
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold ${theme.textMuted} truncate text-lg mb-1 line-through`}
                      style={fonts.heading}
                    >
                      {app.name}
                    </h3>
                    <span
                      className="text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-500 dark:text-red-400"
                      style={fonts.body}
                    >
                      DELETED
                    </span>
                  </div>
                </div>
                <p
                  className={`text-sm ${theme.textSubtle} line-clamp-2 mb-3 line-through`}
                  style={fonts.body}
                >
                  {app.description}
                </p>
                <div className={`text-xs ${theme.textSubtle} font-mono`}>ID: {app.appId}</div>
              </AppCard>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
