import { Edit, Trash2, RefreshCw } from 'lucide-react';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { ActionButton } from '@/components/developer-dashboard/ui/ActionButton';

interface AbilityVersionActionButtonsProps {
  onOpenMutation: (mutationType: string) => void;
}

export function AbilityVersionActionButtons({ onOpenMutation }: AbilityVersionActionButtonsProps) {
  return (
    <div className="space-y-6">
      {/* Version Management Section */}
      <div>
        <h4 className={`text-sm font-semibold ${theme.text} mb-3`} style={fonts.heading}>
          Version Management
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionButton
            icon={Edit}
            title="Edit Version"
            description="Update version details"
            onClick={() => onOpenMutation('edit-version')}
            variant="orange"
            iconBg={`${theme.brandOrange}1A`}
            iconColor={theme.brandOrange}
            hoverBorderColor={theme.brandOrange}
          />

          <ActionButton
            icon={RefreshCw}
            title="Refresh Policies"
            description="Re-check supported policies"
            onClick={() => onOpenMutation('refresh-policies')}
            variant="orange"
            iconBg={`${theme.brandOrange}1A`}
            iconColor={theme.brandOrange}
            hoverBorderColor={theme.brandOrange}
          />

          <ActionButton
            icon={Trash2}
            title="Delete Version"
            description="Remove this version"
            onClick={() => onOpenMutation('delete-version')}
            variant="danger"
            borderColor="rgb(254 202 202 / 0.5)"
            hoverBorderColor="rgb(239 68 68)"
          />
        </div>
      </div>
    </div>
  );
}
