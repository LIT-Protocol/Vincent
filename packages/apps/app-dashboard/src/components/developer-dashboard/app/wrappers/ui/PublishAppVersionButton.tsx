import { Upload, CheckCircle, XCircle } from 'lucide-react';
import { ActionButton } from '@/components/developer-dashboard/ui/ActionButton';

interface PublishAppVersionButtonProps {
  isSubmitting?: boolean;
  onSubmit: () => Promise<void>;
  publishResult?: {
    success: boolean;
    message?: string;
  } | null;
}

export function PublishAppVersionButton({
  isSubmitting = false,
  onSubmit,
  publishResult = null,
}: PublishAppVersionButtonProps) {
  const hasError = publishResult && !publishResult.success;
  const hasSuccess = publishResult && publishResult.success;

  // Determine state-based props
  const getIcon = () => {
    if (hasSuccess) return CheckCircle;
    if (hasError) return XCircle;
    return Upload;
  };

  const getTitle = () => {
    if (isSubmitting) return 'Publishing App Version...';
    if (hasSuccess) return 'Published Successfully!';
    if (hasError) return 'Publication Failed';
    return 'Publish App Version';
  };

  const getDescription = () => {
    if (isSubmitting) return 'Publishing your app version to the blockchain...';
    if (hasSuccess) return publishResult?.message || 'App version published successfully!';
    if (hasError) return publishResult?.message || 'Failed to publish app version';
    return 'Make this version available to users';
  };

  const getVariant = () => {
    if (hasSuccess) return 'success' as const;
    if (hasError) return 'danger' as const;
    return 'orange' as const;
  };

  return (
    <ActionButton
      icon={getIcon()}
      title={getTitle()}
      description={getDescription()}
      onClick={onSubmit}
      disabled={!!hasSuccess}
      isLoading={isSubmitting}
      variant={getVariant()}
      className="w-full"
    />
  );
}
