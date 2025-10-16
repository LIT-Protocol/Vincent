import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../../components/shared/Footer';
import LandingPartners from '../../components/shared/LandingPartners';
import { logos } from '../../components/shared/ExternalLogos';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { toggleTheme } from '@/lib/theme';

const CIRCLE_SIZE = 70;

export default function RootPage() {
  const navigate = useNavigate();
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const isDarkMode = useTheme();

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setShowContent(true);
  }, []);

  const toggleDarkMode = useCallback(() => {
    toggleTheme();
  }, []);

  const handleEarnClick = useCallback(() => {
    setIsTransitioning(true);
    // Wait for fade out to complete before navigating
    setTimeout(() => {
      navigate('/user/apps', { state: { fromTransition: true } });
    }, 500);
  }, [navigate]);

  const handleExploreClick = useCallback(() => {
    setIsTransitioning(true);
    // Wait for fade out to complete before navigating
    setTimeout(() => {
      navigate('/explorer/apps', { state: { fromTransition: true } });
    }, 500);
  }, [navigate]);

  // Memoize scale calculations
  const globeScale = useMemo(() => {
    // Scale content to match the globe (which scales with viewport height)
    // Use CIRCLE_SIZE as the base reference since it matches globe size
    const baseGlobeScale = CIRCLE_SIZE / 70; // 70vh is our base size

    // Also constrain by viewport dimensions to prevent overflow
    const viewportHeight = Math.min(dimensions.height, window.innerHeight);
    const effectiveSize = Math.min(dimensions.width, viewportHeight);
    const responsiveScale = Math.max(0.85, Math.min(1, effectiveSize / 900));

    // Use the smaller of the two scales to ensure content stays within bounds
    return Math.min(baseGlobeScale, responsiveScale);
  }, [dimensions]);

  const isMobile = dimensions.width < 768;

  return (
    <>
      <Helmet>
        <title>Vincent | Delegation Platform</title>
        <meta
          name="description"
          content="Vincent - Delegation Platform for user owned automation secured by Lit Protocol"
        />
        <style>{`
          body {
            overscroll-behavior-y: none;
          }
        `}</style>
      </Helmet>

      {/* Grid container with rows for main content, partners, and footer */}
      <div
        className="grid min-h-screen bg-white dark:bg-gray-950 text-center overflow-x-hidden"
        style={{
          gridTemplateRows: isMobile ? '1fr auto auto' : '1fr auto',
          backgroundImage: 'var(--bg-gradient)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Main content area - all layers in same grid cell */}
        <div className="relative row-start-1 col-start-1">
          {/* Navigation - Top Right (desktop), Top Center (mobile) */}
          <div
            className="flex z-20 gap-1 md:gap-2 transition-opacity duration-500"
            style={{
              opacity: showContent && !isTransitioning ? 1 : 0,
              position: 'fixed',
              top: isMobile ? '1rem' : '1.5rem',
              right: isMobile ? 'auto' : '1.5rem',
              left: isMobile ? '50%' : 'auto',
              transform: isMobile ? 'translateX(-50%)' : 'none',
            }}
          >
            <a
              href="https://t.me/+aa73FAF9Vp82ZjJh"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm transition-colors no-underline !text-gray-900 dark:!text-white hover:bg-gray-100 dark:hover:bg-gray-800 whitespace-nowrap"
              style={{ fontFamily: "'ITC Avant Garde Gothic', sans-serif" }}
            >
              Contact Us
            </a>
            <a
              href="https://docs.heyvincent.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm transition-colors no-underline !text-gray-900 dark:!text-white hover:bg-gray-100 dark:hover:bg-gray-800 whitespace-nowrap"
              style={{ fontFamily: "'ITC Avant Garde Gothic', sans-serif" }}
            >
              Docs
            </a>
            <a
              href="https://spark.litprotocol.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm transition-colors no-underline !text-gray-900 dark:!text-white hover:bg-gray-100 dark:hover:bg-gray-800 whitespace-nowrap"
              style={{ fontFamily: "'ITC Avant Garde Gothic', sans-serif" }}
            >
              Blog
            </a>
            <button
              onClick={toggleDarkMode}
              className="px-2 py-1.5 md:px-2 md:py-1.5 rounded-lg transition-colors !text-gray-900 dark:!text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center -mt-0.5"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg className="w-4 h-4 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>

          {/* Globe is now rendered by parent GlobeLayout */}

          {/* Desktop: Logos orbiting around globe */}
          <div
            className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none z-5 transition-opacity duration-500"
            style={{
              opacity: showContent && !isTransitioning ? 1 : 0,
              marginTop: '60px', // Move down to match globe position
            }}
          >
            <div
              className="relative"
              style={{
                height: `${CIRCLE_SIZE}vh`,
                aspectRatio: '1',
              }}
            >
              {logos.map((logo, i) => {
                const angle = (i / logos.length) * 2 * Math.PI - Math.PI / 2; // Start from top
                const radius = (CIRCLE_SIZE / 2) * 1.05; // 5% larger radius
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                  <a
                    key={i}
                    href={logo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={logo.alt}
                    className="absolute pointer-events-auto transition-opacity duration-200 hover:!opacity-100 cursor-pointer"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `translate(calc(-50% + ${x}vh), calc(-50% + ${y}vh))`,
                      width: `${6.9 * globeScale}vh`,
                      height: `${6.9 * globeScale * 0.67}vh`,
                      opacity: 0.5,
                    }}
                  >
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'brightness(0) saturate(100%) invert(var(--logo-filter-invert))',
                        pointerEvents: 'none',
                      }}
                    />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Layer 2: Main Content (z-10) - fades in on load, fades out during transition */}
          <div
            className="z-10 pointer-events-none transition-opacity duration-500"
            style={{
              position: isMobile ? 'fixed' : 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: isMobile ? '-5vh' : '0',
              opacity: showContent && !isTransitioning ? 1 : 0,
            }}
          >
            <div className="pointer-events-auto">
              <div className="px-8 mb-3 sm:mb-5">
                <img
                  src={isDarkMode ? '/vincent-main-logo-white.png' : '/vincent-main-logo.png'}
                  alt="Vincent by Lit Protocol - Delegation Platform for user owned automation"
                  className="mx-auto"
                  width="400"
                  height="107"
                  style={{
                    aspectRatio: '2051/549',
                    width: isMobile ? `${40 * globeScale}vh` : `${30 * globeScale}vh`,
                    height: 'auto',
                  }}
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                />
              </div>
              <p
                className="text-black dark:text-white mb-6 sm:mb-8 max-w-md px-2"
                style={{
                  fontSize: isMobile ? `${2.2 * globeScale}vh` : `${1.6 * globeScale}vh`,
                  fontFamily: "'Encode Sans Semi Expanded', sans-serif",
                }}
              >
                The portal for intelligent finance.
              </p>

              <div className="flex flex-col items-center gap-4 mb-4 sm:mb-8 max-w-sm mx-auto">
                {/* Top button - Earn */}
                <button
                  onClick={handleEarnClick}
                  className="text-white rounded font-semibold transition-colors hover:bg-[#E03A04]"
                  style={{
                    backgroundColor: '#FF4205',
                    padding: isMobile
                      ? `${1.2 * globeScale}vh ${2.4 * globeScale}vh`
                      : `${0.8 * globeScale}vh ${1.6 * globeScale}vh`,
                    fontSize: isMobile ? `${2.2 * globeScale}vh` : `${1.6 * globeScale}vh`,
                    minWidth: isMobile ? `${16 * globeScale}vh` : `${11.2 * globeScale}vh`,
                    fontFamily: "'ITC Avant Garde Gothic', sans-serif",
                  }}
                >
                  Earn
                </button>

                {/* Bottom row - Build and Explore */}
                <div
                  className="flex"
                  style={{ gap: isMobile ? `${4 * globeScale}vh` : `${3.2 * globeScale}vh` }}
                >
                  <button
                    onClick={() => navigate('/developer/dashboard')}
                    className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded font-semibold border border-gray-900 dark:border-gray-100 transition-all hover:!border-[#FF4205]"
                    style={{
                      padding: isMobile
                        ? `${1.2 * globeScale}vh ${2.4 * globeScale}vh`
                        : `${0.8 * globeScale}vh ${1.6 * globeScale}vh`,
                      fontSize: isMobile ? `${2.2 * globeScale}vh` : `${1.6 * globeScale}vh`,
                      minWidth: isMobile ? `${16 * globeScale}vh` : `${11.2 * globeScale}vh`,
                      fontFamily: "'ITC Avant Garde Gothic', sans-serif",
                    }}
                  >
                    Build
                  </button>
                  <button
                    onClick={handleExploreClick}
                    className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded font-semibold border border-gray-900 dark:border-gray-100 transition-all hover:!border-[#FF4205]"
                    style={{
                      padding: isMobile
                        ? `${1.2 * globeScale}vh ${2.4 * globeScale}vh`
                        : `${0.8 * globeScale}vh ${1.6 * globeScale}vh`,
                      fontSize: isMobile ? `${2.2 * globeScale}vh` : `${1.6 * globeScale}vh`,
                      minWidth: isMobile ? `${16 * globeScale}vh` : `${11.2 * globeScale}vh`,
                      fontFamily: "'ITC Avant Garde Gothic', sans-serif",
                    }}
                  >
                    Explore
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Partners - in second grid row (mobile only) */}
        <div
          className="md:hidden row-start-2 transition-opacity duration-500"
          style={{
            opacity: showContent && !isTransitioning ? 1 : 0,
          }}
        >
          <LandingPartners />
        </div>

        {/* Footer - in third grid row on mobile, second on desktop */}
        <div
          className="z-15 pb-1 sm:pb-3"
          style={{
            gridRow: isMobile ? 3 : 2,
          }}
        >
          <Footer />
        </div>
      </div>
    </>
  );
}
