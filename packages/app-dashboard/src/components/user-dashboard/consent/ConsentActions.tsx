import { Button } from '@/components/shared/ui/button';

interface ConsentActionsProps {
  onApprove: () => void;
  onDisapprove: () => void;
  submitting: boolean;
  disabled?: boolean;
}

const ConsentActions = ({
  onApprove,
  onDisapprove,
  submitting,
  disabled = false,
}: ConsentActionsProps) => {
  return (
    <div className="flex gap-3 mb-4">
      <Button
        className="grow"
        variant="default"
        onClick={onApprove}
        disabled={submitting || disabled}
        title={disabled ? 'This app version is disabled' : undefined}
      >
        {submitting ? 'Processing...' : 'Approve'}
      </Button>
      <Button className="grow" variant="outline" onClick={onDisapprove} disabled={submitting}>
        {submitting ? 'Processing...' : 'Decline'}
      </Button>
    </div>
  );
};

export default ConsentActions;
