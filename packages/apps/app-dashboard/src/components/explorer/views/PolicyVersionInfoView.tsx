import { Policy } from '@/types/developer-dashboard/appTypes';
import { Shield } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface PolicyVersionInfoViewProps {
  policy: Policy;
}

export function PolicyVersionInfoView({ policy }: PolicyVersionInfoViewProps) {
  const { isDark, theme } = useTheme();

  return (
    <div className="group relative">
      <div
        className={`absolute inset-0 ${theme.glowColor} rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
      ></div>
      <div
        className={`relative p-5 rounded-xl ${theme.itemBg} ${theme.itemHoverBg} border ${theme.itemBorder} ${theme.itemHoverBorder} transition-all duration-300`}
      >
        <div className="flex items-center gap-4 mb-3">
          <div
            className={`p-2 rounded-lg ${theme.iconBg} border ${theme.itemBorder} group-hover:${theme.itemHoverBorder} transition-all duration-300`}
          >
            <Shield className={`w-4 h-4 ${theme.iconColorMuted}`} />
          </div>
          <div className="flex-1">
            <p className={`text-base font-light ${isDark ? 'text-white/90' : 'text-black/90'}`}>
              {policy.title}
            </p>
            <p className={`text-xs ${theme.textSubtle}`}>
              {policy.packageName} v{policy.activeVersion}
            </p>
          </div>
        </div>

        <p className={`text-sm ${theme.textMuted} leading-relaxed mb-3`}>{policy.description}</p>
      </div>
    </div>
  );
}
