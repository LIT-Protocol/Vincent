import { Policy } from '@/types/developer-dashboard/appTypes';
import { Shield } from 'lucide-react';
import { PolicyVersionInfoView } from './PolicyVersionInfoView';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

interface AbilityVersionPoliciesViewProps {
  supportedPolicies: Policy[];
}

export function AbilityVersionPoliciesView({ supportedPolicies }: AbilityVersionPoliciesViewProps) {
  return (
    <div className="space-y-4">
      {/* Supported Policies Header */}
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-4 h-4" style={{ color: theme.brandOrange }} />
        <span className={`text-sm font-medium ${theme.textMuted}`} style={fonts.heading}>
          Supported Policies ({supportedPolicies.length})
        </span>
      </div>

      {supportedPolicies.length === 0 ? (
        <div className={`p-8 rounded-xl ${theme.itemBg} border ${theme.cardBorder} text-center`}>
          <Shield className={`w-10 h-10 ${theme.textMuted} mx-auto mb-3`} />
          <p className={`${theme.textMuted} text-sm`} style={fonts.body}>
            No supported policies found
          </p>
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
