import { Policy } from '@/types/developer-dashboard/appTypes';
import { Shield } from 'lucide-react';
import { PolicyVersionInfoView } from './PolicyVersionInfoView';
import { useTheme } from '@/contexts/ThemeContext';

interface ToolVersionPoliciesViewProps {
  supportedPolicies: Policy[];
}

export function ToolVersionPoliciesView({ supportedPolicies }: ToolVersionPoliciesViewProps) {
  const { isDark, theme } = useTheme();

  return (
    <div className="space-y-4">
      {/* Supported Policies Header */}
      <div className="flex items-center gap-3 mb-4">
        <Shield className={`w-4 h-4 ${theme.iconColorMuted}`} />
        <span className={`text-sm font-light ${theme.textMuted}`}>
          Supported Policies ({supportedPolicies.length})
        </span>
      </div>

      {supportedPolicies.length === 0 ? (
        <div className={`p-8 rounded-xl ${theme.itemBg} border ${theme.itemBorder} text-center`}>
          <Shield
            className={`w-10 h-10 ${isDark ? 'text-white/20' : 'text-black/20'} mx-auto mb-3`}
          />
          <p className={`${theme.textSubtle} text-sm`}>No supported policies found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {supportedPolicies.map((policy) => (
            <PolicyVersionInfoView key={policy.packageName} policy={policy} />
          ))}
        </div>
      )}
    </div>
  );
}
