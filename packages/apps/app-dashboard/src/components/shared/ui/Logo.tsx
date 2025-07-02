interface LogoProps {
  logo?: string | null;
  alt: string;
  className?: string;
}

/**
 * A reusable Logo component that handles fallback logic consistently.
 * Validates logo URL length and provides onError fallback to '/logo.svg'
 */
export function Logo({ logo, alt, className = '' }: LogoProps) {
  const hasValidLogo = logo && logo.length >= 10;

  if (hasValidLogo) {
    return (
      <img
        src={logo}
        alt={alt}
        className={className}
        onError={(e) => {
          e.currentTarget.src = '/logo.svg';
        }}
      />
    );
  }

  return <img src="/logo.svg" alt="Vincent logo" className={className} />;
}
