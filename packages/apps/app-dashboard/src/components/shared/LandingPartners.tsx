import React from 'react';
import styles from './LandingPartners.module.css';
import { env } from '@/config/env';

const logos = [
  {
    src: '/external-logos/tria.svg',
    alt: 'Tria',
  },
  {
    src: '/external-logos/aave.svg',
    alt: 'Aave',
  },
  {
    src: '/external-logos/terminal3.svg',
    alt: 'Terminal3',
  },
  {
    src: '/external-logos/deBridge.svg',
    alt: 'deBridge',
  },
  {
    src: '/external-logos/creativelabs.png',
    alt: 'Blockchain Creative Labs',
  },
  {
    src: '/external-logos/ethereum.svg',
    alt: 'Ethereum',
  },
  {
    src: '/external-logos/genius.webp',
    alt: 'Genius',
  },
  {
    src: '/external-logos/morpho.svg',
    alt: 'Morpho',
  },
  {
    src: '/external-logos/emblem.png',
    alt: 'Emblem Vault',
  },
  {
    src: '/external-logos/polymarket.svg',
    alt: 'Polymarket',
  },
  {
    src: '/external-logos/humanity.png',
    alt: 'Humanity Protocol',
  },
  {
    src: '/external-logos/uniswap.svg',
    alt: 'Uniswap',
  },
  {
    src: '/external-logos/gitcoin.svg',
    alt: 'Gitcoin',
  },
  {
    src: '/external-logos/indexnetwork.svg',
    alt: 'Index Network',
  },
  {
    src: '/external-logos/eco.png',
    alt: 'Eco',
  },
  {
    src: '/external-logos/lens.svg',
    alt: 'Lens Protocol',
  },
  {
    src: '/external-logos/streamr.svg',
    alt: 'Streamr',
  },
  {
    src: '/external-logos/solana.svg',
    alt: 'Solana',
  },
];

const LandingPartners: React.FC = () => {
  return (
    <div className="relative bg-transparent py-16 mt-2">
      <div className="max-w-4xl mx-auto px-8 sm:px-4">
        <p className="flex justify-center items-center mb-10 text-gray-600 text-sm sm:text-base font-sans tracking-wide font-medium">
          <a
            href="https://dune.com/lit_protocol/tvm-in-lit-protocol-mainnets"
            target="_blank"
            rel="noopener noreferrer"
            className="!text-gray-600 hover:!text-orange-500 transition-colors !no-underline"
            style={{ textDecoration: 'none' }}
          >
            ${env.VITE_LIT_TOTAL_MANAGED} Managed
          </a>
          <span className="mx-2">•</span>
          Works With All Crypto
        </p>
        <div className={styles.marquee}>
          <div
            className={styles.marqueeGroup}
            style={{ '--logo-count': logos.length } as React.CSSProperties}
          >
            {logos.map((logo, i) => (
              <div key={`first_${i}`} className={styles.logo}>
                <img src={logo.src} alt={logo.alt} />
              </div>
            ))}
            {logos.map((logo, i) => (
              <div key={`second_${i}`} className={styles.logo}>
                <img src={logo.src} alt={logo.alt} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPartners;
