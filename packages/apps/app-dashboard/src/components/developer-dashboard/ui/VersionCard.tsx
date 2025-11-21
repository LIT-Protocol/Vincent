import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

interface VersionCardProps {
  version: number | string;
  activeVersion?: number | string;
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
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: enabled ? 'rgb(134 239 172 / 0.2)' : 'rgb(254 202 202 / 0.2)',
                color: enabled ? 'rgb(22 163 74)' : 'rgb(220 38 38)',
                ...fonts.heading,
              }}
            >
              {enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
