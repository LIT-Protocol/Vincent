interface LoadingProps {
  text?: string;
}

export default function Loading({ text }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      {text && <p className="mt-3 text-xs text-gray-900 dark:text-white font-normal">{text}</p>}
    </div>
  );
}
