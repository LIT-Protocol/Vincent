interface DAppIconProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md';
  className?: string;
}

interface DAppIconFallbackProps {
  name: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function DAppIcon({ src, alt, size = 'sm', className = '' }: DAppIconProps) {
  const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const roundingClasses = size === 'sm' ? 'rounded-full' : 'rounded-md';

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClasses} ${roundingClasses} border border-blue-100 ${className}`}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.onerror = null;
        const color = size === 'sm' ? '%234285F4' : '%23F59E0B';
        target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`;
      }}
    />
  );
}

export function DAppIconFallback({ name, size = 'sm', className = '' }: DAppIconFallbackProps) {
  const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const roundingClasses = size === 'sm' ? 'rounded-full' : 'rounded-md';
  const bgClasses = size === 'sm' ? 'bg-blue-100 text-blue-500' : 'bg-yellow-100 text-yellow-700';

  return (
    <div
      className={`${sizeClasses} ${roundingClasses} ${bgClasses} flex items-center justify-center font-bold ${className}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
