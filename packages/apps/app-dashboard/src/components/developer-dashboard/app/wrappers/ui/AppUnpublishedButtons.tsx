import { Edit, Plus, Trash2 } from 'lucide-react';

interface AppUnpublishedButtonsProps {
  onOpenMutation: (mutationType: string) => void;
}

export function AppUnpublishedButtons({ onOpenMutation }: AppUnpublishedButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => onOpenMutation('edit-app')}
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        <Edit className="h-4 w-4" />
        Edit App
      </button>
      <button
        onClick={() => onOpenMutation('create-app-version')}
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Create App Version
      </button>
      <button
        onClick={() => onOpenMutation('delete-app')}
        className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Delete App
      </button>
    </div>
  );
}
