import { isDarkMode } from '@/lib/theme';

interface SidebarLogoProps {
  logo?: string | null;
  alt: string;
}

/**
 * A specialized Logo component for sidebar items that ensures consistent 20x20 sizing
 * for both real logos and fallback Vincent logos
 */
export function SidebarLogo({ logo, alt }: SidebarLogoProps) {
  const isDark = isDarkMode();
  const hasValidLogo = logo && logo.length >= 10;
  const fallbackLogo = isDark ? '/logo-white.svg' : '/logo.svg';

  return (
    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
      <img
        src={hasValidLogo ? logo : fallbackLogo}
        alt={hasValidLogo ? alt : 'Vincent logo'}
        className="w-5 h-5 object-contain rounded"
        onError={(e) => {
          if (e.currentTarget.src !== fallbackLogo) {
            e.currentTarget.src = fallbackLogo;
          }
        }}
      />
    </div>
  );
}
