interface StatusMessageProps {
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
}

// Define theme-aware styles using Tailwind dark: classes
const statusClasses = {
  info: {
    container:
      'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800',
    icon: 'text-blue-700 dark:text-blue-400',
  },
  warning: {
    container:
      'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-700 dark:text-yellow-400',
  },
  success: {
    container:
      'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/50 dark:text-green-200 dark:border-green-800',
    icon: 'text-green-700 dark:text-green-400',
  },
  error: {
    container:
      'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800',
    icon: 'text-red-700 dark:text-red-400',
  },
} as const;

// Define static icon components outside the component
const WarningIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]">
    <path
      d="M12 9v4M12 16h.01M9.172 19h6.656a2 2 0 001.789-1.106l3.331-6.663a2 2 0 000-1.789L17.617 2.78A2 2 0 0015.829 1.67H9.172a2 2 0 00-1.789 1.106L4.052 9.439a2 2 0 000 1.789l3.331 6.663A2 2 0 009.172 19z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SuccessIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]">
    <path
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]">
    <path
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LoadingIcon = ({ className }: { className: string }) => (
  <div
    className={`w-[18px] h-[18px] border-2 ${className} border-t-transparent animate-spin rounded-full`}
  ></div>
);

// Icon lookup object
const iconComponents = {
  warning: WarningIcon,
  success: SuccessIcon,
  error: ErrorIcon,
  info: LoadingIcon,
} as const;

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

  // Simple lookup for status styles
  const statusStyles = statusClasses[type];

  // Get the appropriate icon component
  const IconComponent = iconComponents[type];

  return (
    <div
      className={`flex items-start p-3 mb-4 rounded-lg text-sm leading-normal transition-all min-h-[48px] opacity-100 ${statusStyles.container}`}
    >
      <div
        className={`flex justify-center items-center w-5 h-5 flex-shrink-0 ${statusStyles.icon}`}
      >
        <IconComponent className={statusStyles.icon} />
      </div>
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
