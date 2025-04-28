import StatusAnimation from './StatusAnimation';

interface RedirectMessageProps {
  showSuccess: boolean;
  showDisapproval: boolean;
  statusMessage: string;
  statusType: 'info' | 'warning' | 'success' | 'error';
}

const RedirectMessage = ({
  showSuccess,
  showDisapproval
}: RedirectMessageProps) => {
  return (
    <div className='text-center'>
      {showSuccess && (
        <div className="py-4">
          <StatusAnimation type="success" />
          <p className="mt-4 text-gray-700">Your request was approved successfully.</p>
        </div>
      )}
      {showDisapproval && (
        <div className="py-4">
          <StatusAnimation type="disapproval" />
          <p className="mt-4 text-gray-700">Your request was denied.</p>
        </div>
      )}
      {!showSuccess && !showDisapproval && (
        <div className="py-4">
          <p className="text-gray-700">Redirecting you to the application...</p>
        </div>
      )}
    </div>
  );
};

export default RedirectMessage; 