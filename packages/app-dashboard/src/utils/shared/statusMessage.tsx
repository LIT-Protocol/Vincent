export const StatusMessage = ({
  message,
  type = 'info',
}: {
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
}) => {
  if (!message) return null;

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

  return (
    <div
      className={`flex items-center p-3 mb-4 rounded-lg text-sm leading-normal w-full transition-all min-h-[48px] opacity-100 ${classes.container}`}
    >
      {type === 'info' && (
        <div className="flex justify-center items-center w-5 h-5 flex-shrink-0">
          <div className="w-[18px] h-[18px] border-2 border-blue-700 rounded-full border-t-transparent animate-spin"></div>
        </div>
      )}
      <span className="ml-3 transition-opacity">{message}</span>
    </div>
  );
};
