import { Edit, Trash2, Plus, List, ArrowLeftRight } from 'lucide-react';
import { theme, fonts } from '@/lib/themeClasses';
import { ActionButton } from '@/components/developer-dashboard/ui/ActionButton';

interface PolicyActionButtonsProps {
  onOpenMutation: (mutationType: string) => void;
}

export function PolicyActionButtons({ onOpenMutation }: PolicyActionButtonsProps) {
  return (
    <div className="space-y-6">
      {/* Policy Management Section */}
      <div>
        <h4 className={`text-sm font-semibold ${theme.text} mb-3`} style={fonts.heading}>
          Policy Management
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ActionButton
            icon={Edit}
            title="Edit Policy"
            description="Update policy details and settings"
            onClick={() => onOpenMutation('edit-policy')}
            variant="orange"
            iconBg={`${theme.brandOrange}1A`}
            iconColor={theme.brandOrange}
            hoverBorderColor={theme.brandOrange}
          />

          <ActionButton
            icon={ArrowLeftRight}
            title="Change Owner"
            description="Transfer policy ownership"
            onClick={() => onOpenMutation('change-owner')}
            variant="orange"
            iconBg={`${theme.brandOrange}1A`}
            iconColor={theme.brandOrange}
            hoverBorderColor={theme.brandOrange}
          />

          <ActionButton
            icon={Trash2}
            title="Delete Policy"
            description="Remove this policy (this can be undone)."
            onClick={() => onOpenMutation('delete-policy')}
            variant="danger"
            borderColor="rgb(254 202 202 / 0.5)"
            hoverBorderColor="rgb(239 68 68)"
          />
        </div>
      </div>

      {/* Version Management Section */}
      <div>
        <h4 className={`text-sm font-semibold ${theme.text} mb-3`} style={fonts.heading}>
          Version Management
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionButton
            icon={List}
            title="View Versions"
            description="View and manage policy versions"
            onClick={() => onOpenMutation('versions')}
            variant="orange"
            iconBg={`${theme.brandOrange}1A`}
            iconColor={theme.brandOrange}
            hoverBorderColor={theme.brandOrange}
          />

          <ActionButton
            icon={Plus}
            title="New Version"
            description="Create a new version of your policy"
            onClick={() => onOpenMutation('create-policy-version')}
            variant="orange"
            iconBg={`${theme.brandOrange}1A`}
            iconColor={theme.brandOrange}
            hoverBorderColor={theme.brandOrange}
          />
        </div>
      </div>
    </div>
  );
}
