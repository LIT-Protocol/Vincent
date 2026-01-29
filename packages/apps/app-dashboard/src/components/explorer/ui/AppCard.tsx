import { App } from '@/types/developer-dashboard/appTypes';
import { Button } from '@/components/shared/ui/button';
import { ExternalLink, Calendar } from 'lucide-react';
import { Logo } from '@/components/shared/ui/Logo';
import { useNavigate } from 'react-router';

interface AppCardProps {
  app: App;
}

export const AppCard = ({ app }: AppCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/explorer/appId/${app.appId}`)}
      className="group/card relative bg-white/40 backdrop-blur-xl border border-black/10 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:border-black/20"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Logo with enhanced styling */}
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black/5 border border-black/5 flex items-center justify-center backdrop-blur-sm">
            <Logo logo={app.logo} alt={`${app.name} logo`} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-light text-base text-black truncate transition-colors duration-300">
                {app.name}
              </h3>
              {app.deploymentStatus && (
                <span className="px-1 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium border border-orange-500 !bg-orange-50 !text-orange-700 backdrop-blur-sm">
                  {app.deploymentStatus.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 transition-colors duration-300">
              <div className="flex items-center gap-1">
                <span>v{app.activeVersion}</span>
              </div>
              {app.updatedAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-black/40" />
                  <span>{new Date(app.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {app.appUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: React.FormEvent) => {
                e.stopPropagation();
                window.open(app.appUrl, '_blank');
              }}
              className="shrink-0 text-black/60 hover:text-black hover:bg-black/5 transition-all duration-300 opacity-0 group-hover/card:opacity-100"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/explorer/appId/${app.appId}`)}
            className="bg-orange-500 hover:bg-orange-600 text-white border-0 transition-all duration-300 hover:scale-105"
          >
            Connect
          </Button>
        </div>
      </div>
    </div>
  );
};
