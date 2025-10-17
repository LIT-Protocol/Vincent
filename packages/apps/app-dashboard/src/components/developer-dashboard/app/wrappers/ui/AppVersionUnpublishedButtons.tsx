import { useNavigate } from 'react-router-dom';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { PublishAppVersionWrapper } from '../PublishAppVersionWrapper';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { ActionButton } from '@/components/developer-dashboard/ui/ActionButton';

interface AppVersionUnpublishedButtonsProps {
  appId: number;
  versionId: number;
  isVersionEnabled: boolean;
  isAppPublished: boolean;
  onOpenMutation: (mutationType: string) => void;
}

export function AppVersionUnpublishedButtons({
  appId,
  versionId,
  isVersionEnabled,
  isAppPublished,
  onOpenMutation,
}: AppVersionUnpublishedButtonsProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {/* Publish App Version - First row, full width */}
      {isVersionEnabled && <PublishAppVersionWrapper isAppPublished={isAppPublished} />}

      {/* Other actions - Second row, 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {isVersionEnabled && (
          <>
            {/* Edit Version Action */}
            <ActionButton
              icon={Edit}
              title="Edit Version"
              description="Modify version details"
              onClick={() => onOpenMutation('edit-version')}
              variant="orange"
              iconBg={`${theme.brandOrange}1A`}
              iconColor={theme.brandOrange}
              hoverBorderColor={theme.brandOrange}
            />

            {/* Manage Abilities Action */}
            <ActionButton
              icon={Plus}
              title="Manage Abilities"
              description="Configure version capabilities"
              onClick={() =>
                navigate(`/developer/apps/appId/${appId}/version/${versionId}/abilities`)
              }
              variant="orange"
              iconBg={`${theme.brandOrange}1A`}
              iconColor={theme.brandOrange}
              hoverBorderColor={theme.brandOrange}
            />
          </>
        )}

        {/* Delete Version Action */}
        <ActionButton
          icon={Trash2}
          title="Delete Version"
          description="Permanently remove this version"
          onClick={() => onOpenMutation('delete-version')}
          variant="danger"
          borderColor="rgb(254 202 202 / 0.3)"
          hoverBorderColor="rgb(248 113 113)"
        />
      </div>
    </div>
  );
}
