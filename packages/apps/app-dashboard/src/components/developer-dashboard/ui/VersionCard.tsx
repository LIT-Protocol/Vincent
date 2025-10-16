import { Power, PowerOff } from 'lucide-react';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

interface VersionCardProps {
  version: number;
  activeVersion?: number;
  enabled?: boolean;
  createdAt: string;
  onClick: () => void;
}

export function VersionCard({
  version,
  activeVersion,
  enabled,
  createdAt,
  onClick,
}: VersionCardProps) {
  return (
    <div
      className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-lg p-4 text-left transition-all hover:shadow-md group cursor-pointer`}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.brandOrange;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '';
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h5 className={`font-semibold ${theme.text}`} style={fonts.heading}>
              Version {version}
            </h5>
            {version === activeVersion && (
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
          <p className={`text-xs ${theme.textMuted} mt-1`} style={fonts.body}>
            Created: {new Date(createdAt).toLocaleDateString()}
          </p>
        </div>
        {enabled !== undefined && (
          <div className="flex items-center gap-2">
            {enabled ? (
              <Power className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <PowerOff className={`h-4 w-4 ${theme.textMuted}`} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
