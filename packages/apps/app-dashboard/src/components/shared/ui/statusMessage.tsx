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

export const StatusMessage = ({
  message,
  type = 'info',
}: {
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
}) => {
  if (!message) return null;

  // Get the appropriate classes for the current status type
  const classes = statusClasses[type];

  return (
    <div
      className={`flex items-center p-3 mb-4 rounded-lg text-sm leading-normal w-full transition-all min-h-[48px] opacity-100 ${classes.container}`}
    >
      <span className="ml-3 transition-opacity">{message}</span>
    </div>
  );
};
