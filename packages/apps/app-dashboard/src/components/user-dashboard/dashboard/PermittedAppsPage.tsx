import { App } from '@/types/developer-dashboard/appTypes';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { Package } from 'lucide-react';
import { AgentAppPermission } from '@/utils/user-dashboard/getAgentPkps';
import { PermittedAppCard } from './ui/PermittedAppCard';

type PermittedAppsPageProps = {
  apps: App[];
  permittedPKPs: AgentAppPermission[];
};

export function PermittedAppsPage({ apps, permittedPKPs }: PermittedAppsPageProps) {
  if (apps.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center max-w-md mx-auto px-6">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${theme.itemBg} ${theme.cardBorder} border mb-6`}
          >
            <Package className={`w-8 h-8 ${theme.textMuted}`} />
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${theme.text}`}>No applications found</h3>
          <p className={`text-sm ${theme.textMuted} leading-relaxed`}>
            You haven't granted permissions to any applications yet. Once you authorize apps,
            they'll appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center md:justify-start px-3 sm:px-6 pt-6">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 max-w-[1600px] place-items-center md:place-items-start">
        {apps.map((app, index) => {
          const permission = permittedPKPs.find((p) => p.appId === app.appId);
          return (
            <PermittedAppCard key={app.appId} app={app} permission={permission} index={index} />
          );
        })}
      </div>
    </div>
  );
}
