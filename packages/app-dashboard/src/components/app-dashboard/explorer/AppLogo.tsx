import { useState } from 'react';
import { AppDetails } from '@/types';

interface AppLogoProps {
  app: AppDetails | any;
  size?: 'md' | 'xl';
}

export const AppLogo = ({ app, size = 'md' }: AppLogoProps) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses =
    {
      md: 'w-12 h-12',
      xl: 'w-24 h-24',
    }[size] || 'w-12 h-12';

  if (app.logo && !imageError) {
    const logoSrc = app.logo.startsWith('data:') ? app.logo : `data:image/png;base64,${app.logo}`;

    return (
      <img
        src={logoSrc}
        alt={`${app.name} logo`}
        className={`${sizeClasses} rounded-xl object-cover shadow-lg`}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <img
      src="/logo.svg"
      alt={`${app.name} logo`}
      className={`${sizeClasses} rounded-xl object-cover shadow-lg`}
    />
  );
};
