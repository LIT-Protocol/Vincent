import { Edit, Trash2, Plus, List } from 'lucide-react';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { ActionButton } from '@/components/developer-dashboard/ui/ActionButton';

interface AppUnpublishedButtonsProps {
  onOpenMutation: (mutationType: string) => void;
}

export function AppUnpublishedButtons({ onOpenMutation }: AppUnpublishedButtonsProps) {
  return (
    <div className="space-y-6">
      {/* App Management Section */}
      <div>
        <h4 className={`text-sm font-semibold ${theme.text} mb-3`} style={fonts.heading}>
          App Management
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionButton
            icon={Edit}
            title="Edit App"
            description="Update app details and settings"
            onClick={() => onOpenMutation('edit-app')}
            variant="orange"
            iconBg={`${theme.brandOrange}1A`}
            iconColor={theme.brandOrange}
            hoverBorderColor={theme.brandOrange}
          />

          <ActionButton
            icon={Trash2}
            title="Delete App"
            description="Remove this app (this can be undone)."
            onClick={() => onOpenMutation('delete-app')}
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
            description="View and manage app versions"
            onClick={() => onOpenMutation('versions')}
            variant="orange"
            iconBg={`${theme.brandOrange}1A`}
            iconColor={theme.brandOrange}
            hoverBorderColor={theme.brandOrange}
          />

          <ActionButton
            icon={Plus}
            title="New Version"
            description="Create a new version of your app"
            onClick={() => onOpenMutation('create-app-version')}
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
