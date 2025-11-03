import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

interface StatusMessageProps {
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  link?: {
    url: string;
    text: string;
  };
}

// Define theme-aware styles using our theme system
const statusClasses = {
  info: {
    container: `${theme.itemBg} ${theme.text} border ${theme.cardBorder}`,
    icon: theme.textMuted,
  },
  warning: {
    container: `${theme.warningBg} ${theme.warningText}`,
    icon: theme.warningText,
  },
  success: {
    container: `${theme.successBg} ${theme.successText}`,
    icon: theme.successText,
  },
  error: {
    container: `${theme.errorBg} ${theme.errorText}`,
    icon: theme.errorText,
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

const StatusMessage = ({ message, type = 'info', link }: StatusMessageProps) => {
  if (!message) return <></>;

  // Handle idle state specially
  const isIdle = message === 'Idle';

  if (isIdle) {
    return (
      <div
        className={`flex items-center justify-center p-3 mb-4 rounded-lg text-sm leading-normal transition-all min-h-[48px] max-h-24 opacity-100 ${theme.itemBg} ${theme.textMuted} border ${theme.cardBorder} overflow-hidden`}
      >
        <span
          className="transition-opacity break-words text-center overflow-wrap-anywhere"
          style={fonts.body}
        >
          {message}
        </span>
      </div>
    );
  }

  // Simple lookup for status styles
  const statusStyles = statusClasses[type];

  // Get the appropriate icon component
  const IconComponent = iconComponents[type];

  return (
    <div
      className={`flex items-start justify-center p-3 mb-4 rounded-lg text-sm leading-normal transition-all min-h-[48px] max-h-24 opacity-100 overflow-hidden ${statusStyles.container}`}
    >
      <div
        className={`flex justify-center items-center w-5 h-5 flex-shrink-0 mt-0.5 ${statusStyles.icon}`}
      >
        <IconComponent className={statusStyles.icon} />
      </div>
      <div className="ml-3 flex-1 overflow-y-auto max-h-16">
        <span
          className="transition-opacity break-words text-center overflow-wrap-anywhere block"
          style={fonts.body}
        >
          {message}
          {link && (
            <>
              {' '}
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: theme.brandOrange }}
                onMouseEnter={(e) => (e.currentTarget.style.color = theme.brandOrangeDarker)}
                onMouseLeave={(e) => (e.currentTarget.style.color = theme.brandOrange)}
              >
                {link.text}
              </a>
            </>
          )}
        </span>
      </div>
    </div>
  );
};

export default StatusMessage;
