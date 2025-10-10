import React from 'react';
import { logos } from './ExternalLogos';
import { env } from '@/config/env';

const LandingPartners: React.FC = () => {
  return (
    <div className="relative bg-transparent py-2">
      <div className="max-w-lg mx-auto px-3">
        <p
          className="flex justify-center items-center mb-2 text-gray-900 dark:text-white text-xs tracking-wide font-medium"
          style={{ fontFamily: "'ITC Avant Garde Gothic', sans-serif" }}
        >
          <a
            href="https://dune.com/lit_protocol/tvm-in-lit-protocol-mainnets"
            target="_blank"
            rel="noopener noreferrer"
            className="!text-gray-900 dark:!text-white hover:!text-orange-500 transition-colors !no-underline"
            style={{ textDecoration: 'none' }}
          >            $250M+ Managed
            ${env.VITE_LIT_TOTAL_MANAGED} Managed
          </a>
          <span className="mx-2">•</span>
          Works With All Crypto
        </p>

        {/* Logo Grid - visible only on mobile/tablet (hidden on desktop where globe shows logos) */}
        <div className="w-full md:hidden">
          <div className="grid grid-cols-6 gap-2 max-w-sm mx-auto">
            {logos.map((logo, i) => (
              <a
                key={i}
                href={logo.url}
                target="_blank"
                rel="noopener noreferrer"
                title={logo.alt}
                className="flex items-center justify-center transition-opacity duration-200 hover:!opacity-100 cursor-pointer"
                style={{ opacity: 0.5 }}
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="w-full h-auto object-contain"
                  style={{
                    maxHeight: '20px',
                    filter: 'brightness(0) saturate(100%) invert(var(--logo-filter-invert))',
                    pointerEvents: 'none',
                  }}
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPartners;
