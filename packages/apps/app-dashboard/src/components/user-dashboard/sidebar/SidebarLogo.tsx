interface SidebarLogoProps {
  logo?: string | null;
  alt: string;
}

/**
 * A specialized Logo component for sidebar items that ensures consistent 20x20 sizing
 * for both real logos and fallback Vincent logos
 */
export function SidebarLogo({ logo, alt }: SidebarLogoProps) {
  const hasValidLogo = logo && logo.length >= 10;

  return (
    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
      <img
        src={hasValidLogo ? logo : '/logo.svg'}
        alt={hasValidLogo ? alt : 'Vincent logo'}
        className="w-5 h-5 object-contain rounded"
        onError={(e) => {
          if (e.currentTarget.src !== '/logo.svg') {
            e.currentTarget.src = '/logo.svg';
          }
        }}
      />
    </div>
  );
} 