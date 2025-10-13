import { useNavigate } from 'react-router-dom';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { PublishAppVersionWrapper } from '../PublishAppVersionWrapper';

interface AppVersionUnpublishedButtonsProps {
  appId: number;
  versionId: number;
  isVersionEnabled: boolean;
  isAppPublished: boolean;
}

export function AppVersionUnpublishedButtons({
  appId,
  versionId,
  isVersionEnabled,
  isAppPublished,
}: AppVersionUnpublishedButtonsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap gap-3">
      {isVersionEnabled && (
        <button
          onClick={() => navigate(`/developer/apps/appId/${appId}/version/${versionId}/edit`)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg text-sm font-medium text-gray-700 dark:text-white/80 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          <Edit className="h-4 w-4" />
          Edit Version
        </button>
      )}
      {isVersionEnabled && (
        <button
          onClick={() => navigate(`/developer/apps/appId/${appId}/version/${versionId}/abilities`)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg text-sm font-medium text-gray-700 dark:text-white/80 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Manage Abilities
        </button>
      )}
      <button
        onClick={() =>
          navigate(`/developer/apps/appId/${appId}/version/${versionId}/delete-version`)
        }
        className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-500/30 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Delete Version
      </button>

      {isVersionEnabled && <PublishAppVersionWrapper isAppPublished={isAppPublished} />}
    </div>
  );
}
