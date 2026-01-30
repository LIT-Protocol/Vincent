import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Package } from 'lucide-react';
import { motion } from 'framer-motion';

import { App } from '@/types/developer-dashboard/appTypes';
import { AppCard } from '@/components/developer-dashboard/ui/AppCard';
import { theme, fonts } from '@/lib/themeClasses';

interface AppWithOwnership extends App {
  isOwnedOnChain?: boolean;
  isInRegistry?: boolean;
  onChainOwner?: string;
}

interface AppsListViewProps {
  apps: AppWithOwnership[];
  deletedApps: AppWithOwnership[];
}

export function AppsListView({ apps, deletedApps }: AppsListViewProps) {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setShowContent(true);
  }, []);

  // Separate apps into registered (on-chain + in registry) and unregistered (on-chain only)
  const registeredApps = apps.filter((app) => app.isInRegistry);
  const unregisteredApps = apps.filter((app) => !app.isInRegistry);

  const renderAppCard = (app: App) => (
    <AppCard
      key={app.appId}
      app={app}
      onClick={() => navigate(`/developer/apps/appId/${app.appId}`)}
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: showContent ? 1 : 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="w-full space-y-8"
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
        <>
          {/* Registered Apps Section */}
          {registeredApps.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold ${theme.text} mb-4`} style={fonts.heading}>
                Registered Apps
              </h3>
              <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {registeredApps.map(renderAppCard)}
              </div>
            </div>
          )}

          {/* Unregistered Apps Section */}
          {unregisteredApps.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold ${theme.text} mb-4`} style={fonts.heading}>
                Unregistered Apps
              </h3>
              <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {unregisteredApps.map(renderAppCard)}
              </div>
            </div>
          )}

          {/* Divider and Create App CTA */}
          <div className="pt-8 border-t border-gray-200 dark:border-white/10">
            <div className="flex flex-col items-center justify-center py-6">
              <h3 className={`text-lg font-semibold ${theme.text} mb-4`} style={fonts.heading}>
                Ready to create another app?
              </h3>
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
        </>
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
                app={app}
                onClick={() => navigate(`/developer/apps/appId/${app.appId}`)}
                variant="deleted"
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
