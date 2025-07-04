interface StatusMessageProps {
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
}

// Function to check if message is a trusted withdrawal message that can contain HTML
const isTrustedWithdrawalMessage = (message: string): boolean => {
  // Only allow HTML for specific withdrawal confirmation messages
  const trustedPatterns = [
    /^.+ withdrawal confirmed!&nbsp;&nbsp;<a href="https:\/\/[^"]+\/tx\/0x[a-fA-F0-9]{64}" target="_blank" rel="noopener noreferrer" class="text-black underline">View transaction<\/a>$/,
    /^Transaction may have failed\.&nbsp;&nbsp;<a href="https:\/\/[^"]+\/tx\/0x[a-fA-F0-9]{64}" target="_blank" rel="noopener noreferrer" class="text-black underline">Check on explorer<\/a>$/,
    /^Ready to send .+ to 0x[a-fA-F0-9]{4}\.\.\.[a-fA-F0-9]{4}\.<br\/>Estimated gas cost: .+$/,
  ];

  return trustedPatterns.some((pattern) => pattern.test(message));
};

const StatusMessage = ({ message, type = 'info' }: StatusMessageProps) => {
  if (!message) return <></>;

  const shouldRenderAsHTML = isTrustedWithdrawalMessage(message);

  // Dictionary of Tailwind classes for different status types
  const statusClasses = {
    info: {
      container: 'bg-blue-50 text-blue-700 border border-blue-200',
      icon: 'text-blue-700',
    },
    warning: {
      container: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      icon: 'text-yellow-700',
    },
    success: {
      container: 'bg-green-50 text-green-700 border border-green-200',
      icon: 'text-green-700',
    },
    error: {
      container: 'bg-red-50 text-red-700 border border-red-200',
      icon: 'text-red-700',
    },
  };

  // Get the appropriate classes for the current status type
  const classes = statusClasses[type];

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <div className={`flex justify-center items-center w-5 h-5 ${classes.icon}`}>
            <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]">
              <path
                d="M12 9v4M12 16h.01M9.172 19h6.656a2 2 0 001.789-1.106l3.331-6.663a2 2 0 000-1.789L17.617 2.78A2 2 0 0015.829 1.67H9.172a2 2 0 00-1.789 1.106L4.052 9.439a2 2 0 000 1.789l3.331 6.663A2 2 0 009.172 19z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className={`flex justify-center items-center w-5 h-5 ${classes.icon}`}>
            <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]">
              <path
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className={`flex justify-center items-center w-5 h-5 ${classes.icon}`}>
            <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]">
              <path
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex justify-center items-center w-5 h-5">
            <div className="w-[18px] h-[18px] border-2 border-blue-700 rounded-full border-t-transparent animate-spin"></div>
          </div>
        );
    }
  };

  return (
    <div
      className={`flex items-start p-3 mb-4 rounded-lg text-sm leading-normal transition-all min-h-[48px] opacity-100 ${classes.container}`}
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      {shouldRenderAsHTML ? (
        <span
          className="ml-3 transition-opacity flex-1 break-words"
          dangerouslySetInnerHTML={{ __html: message }}
        />
      ) : (
        <span className="ml-3 transition-opacity flex-1 break-words">{message}</span>
      )}
    </div>
  );
};

export default StatusMessage;
