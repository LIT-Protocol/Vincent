import { Policy } from '@/types/developer-dashboard/appTypes';
import { Shield } from 'lucide-react';
import { Logo } from '@/components/shared/ui/Logo';
import { theme, fonts } from '@/lib/themeClasses';

interface PolicyVersionInfoViewProps {
  policy: Policy;
}

export function PolicyVersionInfoView({ policy }: PolicyVersionInfoViewProps) {
  return (
    <div className="group relative">
      <div
        className={`relative p-5 rounded-xl ${theme.itemBg} border ${theme.cardBorder} ${theme.cardHoverBorder} transition-all duration-300`}
      >
        <div className="flex items-center gap-4 mb-3">
          <div
            className={`w-10 h-10 rounded-lg ${theme.iconBg} border ${theme.iconBorder} ${theme.cardHoverBorder} transition-all duration-300 flex items-center justify-center overflow-hidden`}
          >
            {policy.logo ? (
              <Logo
                logo={policy.logo}
                alt={`${policy.title} logo`}
                className="w-full h-full object-contain"
              />
            ) : (
              <Shield className={`w-4 h-4 ${theme.textMuted}`} />
            )}
          </div>
          <div className="flex-1">
            <p className={`text-base font-medium ${theme.text}`} style={fonts.heading}>
              {policy.title}
            </p>
            <a
              href={`https://www.npmjs.com/package/${policy.packageName}/v/${policy.activeVersion}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-75 transition-opacity inline-block"
              title={`View ${policy.packageName} v${policy.activeVersion} on npm`}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <img src="/npm.png" alt="npm" className="w-full h-full object-contain" />
              </div>
            </a>
          </div>
        </div>

        <p className={`text-sm ${theme.textMuted} leading-relaxed mb-3`} style={fonts.body}>
          {policy.description}
        </p>
      </div>
    </div>
  );
}
