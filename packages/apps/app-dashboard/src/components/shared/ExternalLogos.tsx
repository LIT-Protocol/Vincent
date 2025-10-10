import { useState, useEffect } from 'react';

export const logos = [
  { src: '/external-logos/tria.svg', alt: 'Tria', url: 'https://app.tria.so/' },
  { src: '/external-logos/aave.svg', alt: 'Aave', url: 'https://aave.com/' },
  { src: '/external-logos/terminal3.svg', alt: 'Terminal3', url: 'https://www.terminal3.io/' },
  { src: '/external-logos/deBridge.svg', alt: 'deBridge', url: 'https://debridge.finance/' },
  {
    src: '/external-logos/creativelabs.png',
    alt: 'Blockchain Creative Labs',
    url: 'https://www.foxcareers.com/OurBrands/BlockchainCreativeLabs',
  },
  { src: '/external-logos/ethereum.svg', alt: 'Ethereum', url: 'https://ethereum.org/' },
  { src: '/external-logos/genius.webp', alt: 'Genius', url: 'https://www.tradegenius.com' },
  { src: '/external-logos/morpho.svg', alt: 'Morpho', url: 'https://morpho.org/' },
  { src: '/external-logos/emblem.png', alt: 'Emblem Vault', url: 'https://emblem.vision/' },
  { src: '/external-logos/polymarket.svg', alt: 'Polymarket', url: 'https://polymarket.com/' },
  {
    src: '/external-logos/humanity.png',
    alt: 'Humanity Protocol',
    url: 'https://www.humanity.org/',
  },
  { src: '/external-logos/uniswap.svg', alt: 'Uniswap', url: 'https://app.uniswap.org/' },
  { src: '/external-logos/gitcoin.svg', alt: 'Gitcoin', url: 'https://www.gitcoin.co/' },
  { src: '/external-logos/indexnetwork.svg', alt: 'Index Network', url: 'https://index.network/' },
  { src: '/external-logos/eco.png', alt: 'Eco', url: 'https://eco.com/' },
  { src: '/external-logos/lens.svg', alt: 'Lens Protocol', url: 'https://lens.xyz/' },
  { src: '/external-logos/streamr.svg', alt: 'Streamr', url: 'https://streamr.network/' },
  { src: '/external-logos/solana.svg', alt: 'Solana', url: 'https://solana.com/' },
];

interface ExternalLogosProps {
  isDarkMode: boolean;
}

export default function ExternalLogos({ isDarkMode }: ExternalLogosProps) {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine logos per row based on screen width
  const logosPerRow = dimensions.width < 640 ? 3 : dimensions.width < 1024 ? 6 : 9;

  // Calculate logo size based on viewport
  const logoSize = dimensions.width < 640 ? { width: 48, height: 32 } : { width: 60, height: 40 };

  const rows: (typeof logos)[] = [];
  for (let i = 0; i < logos.length; i += logosPerRow) {
    rows.push(logos.slice(i, i + logosPerRow));
  }

  return (
    <div className="w-full px-2 sm:px-4">
      <div className="flex flex-col gap-2 sm:gap-4 md:gap-6 items-center">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex gap-3 sm:gap-6 md:gap-8 justify-center items-center flex-wrap"
          >
            {row.map((logo, i) => {
              const sharedClasses = `block transition-opacity duration-200 opacity-50 cursor-pointer hover:!opacity-100`;
              const sharedStyles = {
                width: `${logoSize.width}px`,
                height: `${logoSize.height}px`,
              };

              const imgElement = (
                <img
                  src={logo.src}
                  alt={logo.alt}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: `brightness(0) saturate(100%) ${isDarkMode ? 'invert(1)' : ''}`,
                  }}
                />
              );

              return (
                <a
                  key={i}
                  href={logo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={logo.alt}
                  className={sharedClasses}
                  style={sharedStyles}
                >
                  {imgElement}
                </a>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
