import { Upload } from 'lucide-react';

interface PublishAppVersionButtonProps {
  isSubmitting?: boolean;
  onSubmit: () => Promise<void>;
}

export function PublishAppVersionButton({
  isSubmitting = false,
  onSubmit,
}: PublishAppVersionButtonProps) {
  return (
    <button
      type="button"
      onClick={onSubmit}
      disabled={isSubmitting}
      className="inline-flex items-center gap-2 px-4 py-2 border border-green-300 dark:border-green-500/30 rounded-lg text-sm font-medium text-green-700 dark:text-green-400 bg-white dark:bg-neutral-800 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSubmitting ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 dark:border-gray-300"></div>
      ) : (
        <Upload className="h-4 w-4" />
      )}
      {isSubmitting ? 'Publishing...' : 'Publish App Version'}
    </button>
  );
}
