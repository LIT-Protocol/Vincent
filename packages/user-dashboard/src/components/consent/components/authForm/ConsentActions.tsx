interface ConsentActionsProps {
  onApprove: () => void;
  onDisapprove: () => void;
  submitting: boolean;
  disabled?: boolean;
}

const ConsentActions = ({ onApprove, onDisapprove, submitting, disabled = false }: ConsentActionsProps) => {
  return (
    <div className='flex gap-3 mb-4'>
      <button
        className='flex-1 bg-black text-white rounded-lg py-3 font-medium text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        onClick={onApprove}
        disabled={submitting || disabled}
        title={disabled ? 'This app version is disabled' : undefined}
      >
        {submitting ? 'Processing...' : 'Approve'}
      </button>
      <button
        className='flex-1 bg-white text-gray-700 border border-gray-200 rounded-lg py-3 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        onClick={onDisapprove}
        disabled={submitting}
      >
        {submitting ? 'Processing...' : 'Decline'}
      </button>
    </div>
  );
};

export default ConsentActions; 