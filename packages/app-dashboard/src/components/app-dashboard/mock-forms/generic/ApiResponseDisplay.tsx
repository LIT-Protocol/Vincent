interface ApiResponseDisplayProps {
  result: any;
  title?: string;
  variant?: 'success' | 'error' | 'info' | 'warning';
  className?: string;
}

const variantStyles = {
  success: {
    container: 'bg-green-50 border-green-200',
    title: 'text-green-900',
    content: 'text-green-800',
  },
  error: {
    container: 'bg-red-50 border-red-200',
    title: 'text-red-900',
    content: 'text-red-800',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    title: 'text-blue-900',
    content: 'text-blue-800',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    title: 'text-yellow-900',
    content: 'text-yellow-800',
  },
};

export function ApiResponseDisplay({
  result,
  title,
  variant = 'info',
  className = '',
}: ApiResponseDisplayProps) {
  if (!result) return null;

  const detectedVariant = result.error ? 'error' : variant;
  const styles = variantStyles[detectedVariant];

  const displayTitle = title || (result.error ? 'Error' : 'Response');

  return (
    <div className={`mt-4 p-4 rounded border ${styles.container} ${className}`}>
      <h5 className={`font-semibold ${styles.title} mb-2`}>{displayTitle}:</h5>
      {result.error ? (
        <p className={styles.content}>{result.error}</p>
      ) : (
        <pre className={`text-sm overflow-auto ${styles.content}`}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
