import { Edit, Trash2, Plus, List, ArrowLeftRight } from 'lucide-react';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { ActionButton } from '@/components/developer-dashboard/ui/ActionButton';

interface AbilityActionButtonsProps {
  onOpenMutation: (mutationType: string) => void;
}

export function AbilityActionButtons({ onOpenMutation }: AbilityActionButtonsProps) {
  return (
    <div className="space-y-6">
      {/* Ability Management Section */}
      <div>
        <h4 className={`text-sm font-semibold ${theme.text} mb-3`} style={fonts.heading}>
          Ability Management
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ActionButton
            icon={Edit}
            title="Edit Ability"
            description="Update ability details and settings"
            onClick={() => onOpenMutation('edit-ability')}
            variant="orange"
            iconBg={`${theme.brandOrange}1A`}
            iconColor={theme.brandOrange}
            hoverBorderColor={theme.brandOrange}
          />

          <ActionButton
            icon={ArrowLeftRight}
            title="Change Owner"
            description="Transfer ability ownership"
            onClick={() => onOpenMutation('change-owner')}
            variant="orange"
            iconBg={`${theme.brandOrange}1A`}
            iconColor={theme.brandOrange}
            hoverBorderColor={theme.brandOrange}
          />

          <ActionButton
            icon={Trash2}
            title="Delete Ability"
            description="Permanently remove this ability"
            onClick={() => onOpenMutation('delete-ability')}
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
            description="View and manage ability versions"
            onClick={() => onOpenMutation('versions')}
            variant="orange"
            iconBg={`${theme.brandOrange}1A`}
            iconColor={theme.brandOrange}
            hoverBorderColor={theme.brandOrange}
          />

          <ActionButton
            icon={Plus}
            title="New Version"
            description="Create a new version of your ability"
            onClick={() => onOpenMutation('create-ability-version')}
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
