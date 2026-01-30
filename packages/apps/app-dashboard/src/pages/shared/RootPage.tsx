import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

import { ScrollIndicator } from '@/components/shared/ui/ScrollIndicator';
import { StatCard } from '@/components/shared/ui/StatCard';
import { Footer } from '@/components/shared/Footer';
import LandingPartners from '@/components/shared/LandingPartners';
import { fonts } from '@/lib/themeClasses';
import { env } from '@/config/env';
import { logos } from '@/components/shared/ExternalLogos';
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

  // Scroll-based animations - only fade landing section
  const { scrollY } = useScroll();
  const landingOpacity = useTransform(scrollY, [0, 600], [1, 0]);

  // Stats from environment variables
  const tvm = env.VITE_LIT_TOTAL_MANAGED;
  const totalApps = env.VITE_TOTAL_APPS;
  const totalAbilities = env.VITE_TOTAL_ABILITIES;

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

  const handleExploreClick = useCallback(() => {
    setIsTransitioning(true);
    // Wait for fade out to complete before navigating
    setTimeout(() => {
      window.scrollTo(0, 0);
      navigate('/explorer/apps', { state: { fromTransition: true } });
    }, 500);
  }, [navigate]);

  const handleBuildClick = useCallback(() => {
    setIsTransitioning(true);
    // Wait for fade out to complete before navigating
    setTimeout(() => {
      window.scrollTo(0, 0);
      navigate('/developer/dashboard', { state: { fromTransition: true } });
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

      {/* Main container */}
      <motion.div
        className="bg-white dark:bg-gray-950 text-center overflow-x-hidden"
        style={{
          backgroundImage: 'var(--bg-gradient)',
          backgroundSize: '24px 24px',
        }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {/* Landing section with globe - min-h-screen */}
        <div className="relative min-h-screen grid" style={{ gridTemplateRows: '1fr auto' }}>
          {/* All layers in same grid cell - with scroll-based fade */}
          <motion.div
            className="relative row-start-1 col-start-1"
            style={{ opacity: landingOpacity }}
          >
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
                style={fonts.heading}
              >
                Contact Us
              </a>
              <a
                href="https://docs.heyvincent.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm transition-colors no-underline !text-gray-900 dark:!text-white hover:bg-gray-100 dark:hover:bg-gray-800 whitespace-nowrap"
                style={fonts.heading}
              >
                Docs
              </a>
              <a
                href="https://spark.litprotocol.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm transition-colors no-underline !text-gray-900 dark:!text-white hover:bg-gray-100 dark:hover:bg-gray-800 whitespace-nowrap"
                style={fonts.heading}
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
            <motion.div
              className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none z-5 transition-opacity duration-500"
              style={{
                opacity: showContent && !isTransitioning ? 1 : 0,
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
            </motion.div>

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
                  className="text-black dark:text-white max-w-md px-2 mb-12"
                  style={{
                    fontSize: isMobile ? `${2.2 * globeScale}vh` : `${1.6 * globeScale}vh`,
                    fontFamily: "'Encode Sans Semi Expanded', sans-serif",
                  }}
                >
                  The portal for intelligent finance.
                </p>

                {/* Scroll Indicator */}
                <ScrollIndicator />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Hero Section */}
        <div className="relative py-20 px-4 md:px-8 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="mb-16 p-8 md:p-12 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg"
          >
            <div className="text-center mb-8">
              <div
                className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium"
                style={fonts.heading}
              >
                INTRODUCING VINCENT
              </div>
              <h2
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3"
                style={fonts.heading}
              >
                The Future of Intelligent Finance
              </h2>
              <p
                className="text-sm text-gray-600 dark:text-gray-400 max-w-4xl mx-auto"
                style={fonts.body}
              >
                Vincent is an automation and delegation platform that enables secure bridging and
                transactions across Solana, EVM, and native Bitcoin for your service, application,
                or AI Agent.
              </p>
            </div>
            <div className="max-w-4xl mx-auto space-y-6 text-left">
              <div className="flex gap-4 pb-6 pt-6 border-t border-b border-gray-200 dark:border-white/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 32 32"
                  fill="#FF4205"
                  stroke="#FF4205"
                  strokeMiterlimit="10"
                  className="w-9 h-9 flex-shrink-0 mt-5"
                >
                  <path
                    strokeWidth=".45"
                    d="M16.01 8.24c4.3 0 7.8 3.5 7.8 7.8s-3.5 7.8-7.8 7.8-7.8-3.5-7.8-7.8 3.5-7.8 7.8-7.8Zm0-.46c-4.56 0-8.25 3.7-8.25 8.25s3.7 8.25 8.25 8.25 8.25-3.7 8.25-8.25-3.7-8.25-8.25-8.25Z"
                  ></path>
                  <rect strokeWidth=".45" x="15.77" y="7.78" width=".49" height="16.51"></rect>
                  <rect strokeWidth=".45" x="7.76" y="15.79" width="16.51" height=".49"></rect>
                  <path
                    strokeWidth=".45"
                    d="M16.01 8.24c1.99 0 3.67 3.57 3.67 7.8s-1.68 7.8-3.67 7.8-3.67-3.57-3.67-7.8 1.68-7.8 3.67-7.8Zm0-.46c-2.28 0-4.13 3.7-4.13 8.25s1.85 8.25 4.13 8.25 4.13-3.7 4.13-8.25-1.85-8.25-4.13-8.25Z"
                  ></path>
                  <path
                    strokeWidth=".45"
                    d="M16.01 12.37c4.23 0 7.8 1.68 7.8 3.67s-3.57 3.67-7.8 3.67-7.8-1.68-7.8-3.67 3.57-3.67 7.8-3.67Zm0-.46c-4.56 0-8.25 1.85-8.25 4.13s3.7 4.13 8.25 4.13 8.25-1.85 8.25-4.13-3.7-4.13-8.25-4.13Z"
                  ></path>
                  <path
                    strokeWidth=".5"
                    d="M28.48 14.32c-.3-2.22-1.18-4.25-2.48-5.94.24-.29.38-.66.38-1.07 0-.93-.76-1.69-1.69-1.69-.41 0-.78.14-1.07.39-1.69-1.29-3.72-2.16-5.93-2.45-.07-.87-.79-1.56-1.68-1.56s-1.62.69-1.68 1.56c-2.21.3-4.23 1.17-5.92 2.45-.29-.25-.67-.4-1.08-.4-.93 0-1.69.76-1.69 1.69 0 .41.15.79.39 1.08-1.29 1.69-2.17 3.72-2.47 5.93-.86.07-1.54.8-1.54 1.68s.67 1.61 1.54 1.68c.29 2.22 1.16 4.26 2.45 5.96-.23.29-.37.65-.37 1.05 0 .93.76 1.69 1.69 1.69.4 0 .76-.13 1.04-.36 1.7 1.31 3.74 2.19 5.97 2.48.09.84.81 1.5 1.68 1.5s1.58-.65 1.68-1.5c2.23-.29 4.28-1.18 5.98-2.48.28.22.64.35 1.03.35.93 0 1.69-.76 1.69-1.69 0-.39-.13-.75-.36-1.04 1.3-1.7 2.17-3.75 2.46-5.97.85-.08 1.52-.8 1.52-1.68s-.67-1.6-1.52-1.68Zm-4.81-7.65c.09-.14.2-.26.34-.35.2-.13.43-.21.69-.21.67 0 1.21.54 1.21 1.21 0 .25-.08.49-.21.68-.09.14-.21.25-.35.34-.19.12-.41.19-.65.19-.67 0-1.21-.54-1.21-1.21 0-.24.07-.46.18-.64ZM14.81 3.51c.08-.58.59-1.02 1.19-1.02s1.1.44 1.19 1.02c.01.06.02.12.02.19 0 .1-.01.2-.04.3-.13.52-.6.91-1.17.91s-1.04-.39-1.17-.91c-.03-.1-.04-.2-.04-.3 0-.06 0-.12.01-.18Zm-7.5 2.59c.26 0 .5.08.7.22.13.09.25.22.33.36.11.18.18.4.18.63 0 .67-.54 1.21-1.21 1.21-.23 0-.45-.07-.63-.18-.14-.09-.26-.2-.35-.34-.14-.2-.22-.43-.22-.69 0-.67.54-1.21 1.21-1.21ZM3.69 17.21c-.07 0-.14 0-.21-.02-.57-.1-1-.59-1-1.19s.43-1.09 1-1.19c.07-.01.14-.02.21-.02.1 0 .19.01.28.03.53.13.93.6.93 1.17s-.4 1.05-.93 1.18c-.09.02-.18.03-.28.03Zm3.62 8.69c-.67 0-1.21-.54-1.21-1.21 0-.24.07-.47.19-.66.09-.14.21-.26.35-.35.19-.13.42-.2.67-.2.67 0 1.21.54 1.21 1.21 0 .25-.07.48-.2.67-.09.14-.21.25-.35.34-.19.12-.41.19-.65.19ZM17.18 28.56c-.11.55-.6.96-1.18.96s-1.07-.41-1.18-.96c-.01-.08-.02-.16-.02-.25 0-.08 0-.16.02-.24.11-.55.6-.97 1.18-.97s1.07.42 1.18.97c.02.08.02.16.02.24 0 .08 0 .17-.02.25ZM24.69 25.9c-.24 0-.46-.07-.64-.19-.14-.09-.26-.2-.35-.34-.13-.2-.21-.43-.21-.68 0-.67.54-1.21 1.21-1.21.25 0 .49.08.68.21.14.1.25.22.34.36.12.19.19.41.19.64 0 .67-.54 1.21-1.21 1.21Zm.98-2.59c-.28-.2-.61-.31-.98-.31-.93 0-1.69.76-1.69 1.69 0 .37.12.7.32.98-1.61 1.23-3.55 2.06-5.65 2.35-.14-.79-.83-1.4-1.66-1.4s-1.53.6-1.66 1.4c-2.1-.29-4.03-1.12-5.65-2.35.2-.28.31-.61.31-.97 0-.93-.76-1.69-1.69-1.69-.36 0-.69.11-.97.3-1.22-1.61-2.04-3.55-2.33-5.65.78-.15 1.36-.84 1.36-1.66s-.58-1.5-1.35-1.66c.29-2.1 1.12-4.02 2.35-5.63.27.18.59.28.93.28.93 0 1.69-.76 1.69-1.69 0-.35-.1-.67-.28-.93 1.61-1.22 3.54-2.04 5.63-2.33.16.76.84 1.33 1.65 1.33s1.49-.57 1.65-1.34c2.1.28 4.02 1.11 5.63 2.33-.18.27-.28.59-.28.94 0 .93.76 1.69 1.69 1.69.35 0 .68-.11.95-.29 1.23 1.61 2.06 3.53 2.36 5.63-.78.15-1.37.83-1.37 1.66s.59 1.52 1.38 1.66c-.28 2.1-1.11 4.04-2.33 5.65Zm2.87-6.42c-.07.01-.15.02-.23.02-.09 0-.17 0-.26-.03-.54-.12-.95-.6-.95-1.18s.41-1.06.95-1.18c.08-.02.17-.03.26-.03.08 0 .15 0 .22.02.56.1.98.6.98 1.19s-.42 1.08-.98 1.19Z"
                  ></path>
                </svg>
                <div className="flex-1">
                  <div
                    className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium"
                    style={fonts.heading}
                  >
                    SECURITY
                  </div>
                  <h3
                    className="text-lg font-bold text-gray-900 dark:text-white mb-3"
                    style={fonts.heading}
                  >
                    Decentralized Key Management
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400" style={fonts.body}>
                    Uses Lit Protocol's Programmable Key Pairs to manage agent identities without
                    exposing private keys
                  </p>
                </div>
              </div>
              <div className="flex gap-4 pb-6 border-b border-gray-200 dark:border-white/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 32 32"
                  className="w-9 h-9 flex-shrink-0 mt-5"
                  fill="#FF4205"
                  stroke="#FF4205"
                  strokeWidth="0.3"
                >
                  <g id="icon_group">
                    <path d="M29.46,19.45l-4.46-2.57-.09-.05-.18-.11-.27.16-.09.05-1.76,1.02h-.02s-.47.29-.47.29h0s-.02.01-.02.01l-.49.28-1.61.93-.54.31v6.09l.27.16,1.1.64.52.3,3.11,1.8.27.15.27-.15,4.73-2.73.27-.16v-6.09l-.54-.31ZM24.46,28.12l-2.64-1.53-.5-.29-1.31-.76v-4.84l1.65.95.11.06.36.21.11.06,1.73,1,.47.27.04.02v4.84ZM29.46,25.54l-4.46,2.58v-4.84l1.03-.6,3.43-1.98v4.84ZM25.62,22.29l-.89.51-.1-.06-.47-.27-1.75-1.01-.09-.05-.38-.22-.09-.05-1.85-1.06,2.02-1.16.16-.09h0s.51-.3.51-.3h0s1.83-1.06,1.83-1.06l.21-.12.36.2,4.38,2.53-3.84,2.22Z"></path>
                    <path d="M2.3,20.02v.54h.18v-.54h-.18Z"></path>
                    <path d="M2,17.76v10.11h10.68v-10.11H2ZM5.28,18.3h6.92v1.72h-6.92v-1.72ZM12.2,27.33H2.48v-6.77h-.18v-.54h.18v-1.72h2.32v1.72h-2.32v.54h9.72v6.77Z"></path>
                    <rect x="2.3" y="20.02" width=".18" height=".54"></rect>
                    <path d="M16.02,3.11l-5.54,3.2v6.4l.16.09,5.38,3.11,5.37-3.1.17-.1v-6.4l-5.54-3.2ZM21.03,12.39l-.11.06-4.9,2.83-4.9-2.83-.1-.06v-5.77l5-2.89,5,2.89v5.77Z"></path>
                    <path d="M15.96,12.75c-.1,0-.21,0-.31-.01-.92-.08-1.75-.6-2.16-1.37-.1-.19-.17-.39-.21-.58-.08-.31-.08-.65-.01-1,.07-.35.22-.63.38-.91.12-.23.24-.44.3-.68l.11-.43.33.29c.15.13.26.3.34.47l.09-.13c.3-.56.42-1.2.31-1.83l-.07-.45.43.16c.68.25,1.22.77,1.49,1.41,0-.11.01-.24,0-.39l-.02-.64.47.43c.53.49.96,1.15,1.21,1.87.22.64.25,1.28.08,1.85-.05.19-.13.38-.23.56-.49.88-1.42,1.39-2.53,1.39ZM14.27,8.85c-.05.1-.1.19-.15.29-.14.25-.27.49-.32.76-.05.27-.05.53,0,.78.03.15.09.3.16.45.32.6.98,1.02,1.72,1.08,1.03.09,1.9-.33,2.33-1.1.08-.14.14-.29.18-.44h0c.13-.47.11-1-.07-1.53-.15-.43-.37-.83-.64-1.18-.06.43-.19.74-.41.92l-.45.39v-.6c0-.7-.36-1.32-.93-1.69,0,.59-.14,1.17-.43,1.7l-.75,1.13-.15-.6c-.03-.13-.06-.25-.11-.37Z"></path>
                    <polygon points="19.74 22.39 19.46 22.85 16.01 20.76 12.56 22.85 12.28 22.39 15.75 20.28 15.75 15.28 16.29 15.28 16.29 20.3 19.74 22.39"></polygon>
                  </g>
                </svg>
                <div className="flex-1">
                  <div
                    className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium"
                    style={fonts.heading}
                  >
                    FLEXIBILITY
                  </div>
                  <h3
                    className="text-lg font-bold text-gray-900 dark:text-white mb-3"
                    style={fonts.heading}
                  >
                    Fine-Grained Control
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400" style={fonts.body}>
                    Full authority over policies with verifiable on-chain operations and instant
                    revocation
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 32 32"
                  className="w-9 h-9 flex-shrink-0 mt-5"
                  fill="#FF4205"
                  stroke="#FF4205"
                  strokeWidth="0.3"
                >
                  <path d="M18.4,5.4c.29.06.54.24.7.5.16.26.21.59.14.89-.24.94.38,1.68.99,2.04.6.35,1.56.53,2.26-.13.23-.21.53-.33.84-.31.3.01.58.14.78.37,1.04,1.16,1.82,2.55,2.28,4.04.18.59-.15,1.2-.76,1.39-.89.28-1.22,1.17-1.23,1.85s.3,1.57,1.18,1.88c.6.21.92.82.72,1.41-.48,1.45-1.29,2.82-2.35,3.95-.41.44-1.08.47-1.55.08-.57-.48-1.43-.51-2.17-.08-.74.43-1.14,1.17-1.02,1.91.1.6-.26,1.17-.83,1.29-.76.17-1.52.25-2.31.25s-1.55-.08-2.31-.25c-.56-.12-.93-.69-.83-1.29.12-.73-.28-1.48-1.02-1.91-.74-.43-1.6-.39-2.17.08-.48.4-1.14.36-1.55-.08-1.05-1.13-1.87-2.5-2.35-3.95-.19-.58.13-1.2.72-1.41.89-.31,1.19-1.2,1.18-1.88,0-.67-.34-1.56-1.23-1.85-.6-.19-.93-.8-.76-1.39.45-1.49,1.24-2.88,2.28-4.04.2-.22.48-.35.78-.37.3-.01.61.1.84.31.7.66,1.66.48,2.26.13s1.22-1.1.99-2.04c-.08-.3-.03-.63.14-.89.16-.26.41-.43.7-.5.76-.17,1.54-.25,2.33-.25s1.57.08,2.33.25ZM9.25,9.13c-.11-.11-.26-.16-.4-.15-.14,0-.27.07-.36.17-.98,1.09-1.72,2.41-2.15,3.82-.08.27.08.55.37.65.99.31,1.63,1.26,1.65,2.41.01,1.15-.61,2.11-1.58,2.45-.29.1-.44.39-.35.66.45,1.37,1.22,2.66,2.22,3.73.19.2.51.21.73.02.77-.64,1.88-.69,2.85-.14.96.55,1.47,1.54,1.31,2.52-.05.29.11.55.37.61.72.16,1.44.24,2.19.24.75,0,1.46-.08,2.19-.24.25-.06.42-.32.37-.61-.16-.98.35-1.97,1.31-2.52.96-.55,2.08-.5,2.85.14.23.19.54.18.73-.02,1-1.07,1.76-2.36,2.22-3.73.09-.27-.07-.56-.35-.66-.98-.34-1.6-1.3-1.58-2.45.01-1.15.66-2.09,1.65-2.41.29-.09.45-.37.37-.65-.43-1.4-1.17-2.72-2.15-3.82-.09-.1-.22-.16-.36-.17-.15,0-.29.05-.4.15-.78.73-1.94.81-2.97.21-1.03-.6-1.52-1.66-1.26-2.7.04-.15.01-.31-.06-.43-.07-.12-.19-.2-.33-.23-1.44-.32-2.96-.32-4.4,0-.14.03-.25.11-.33.23-.08.13-.1.28-.06.43.26,1.03-.24,2.09-1.26,2.7-.46.27-.94.4-1.41.4-.58,0-1.13-.21-1.56-.61Z"></path>
                  <path d="M20.69,15.93c0,2.54-2.07,4.61-4.61,4.61s-4.61-2.07-4.61-4.61,2.07-4.61,4.61-4.61,4.61,2.07,4.61,4.61ZM20.09,15.93c0-2.21-1.8-4.02-4.02-4.02s-4.02,1.8-4.02,4.02,1.8,4.02,4.02,4.02,4.02-1.8,4.02-4.02Z"></path>
                  <path d="M15.5,2.6h.03l.06-.05s-.06.04-.09.05Z"></path>
                  <path d="M7.1,28.66c-.03-.12-.59-2.29-.59-2.29,0,0-.06-.18-.05-.28.01-.09.07-.17.15-.21.1-.05.3-.03.3-.03s.25.02.38.03c.21.02.41.03.62.05.22.02,1.03.08,1.21.1.07,0,.15.01.22.02.16.01.29.16.27.32,0,.07-.04.14-.08.19-.06.06-.15.09-.23.09l-1.67-.13c5.26,4.23,12.98,3.9,17.87-.98,4.68-4.68,5.18-11.97,1.48-17.21-.09-.13-.07-.31.07-.41.13-.09.32-.07.41.07,3.86,5.46,3.34,13.08-1.54,17.97-5.09,5.09-13.14,5.44-18.63,1.05l.4,1.56c.03.1,0,.21-.08.28-.04.04-.08.06-.14.08-.16.04-.32-.06-.36-.21Z"></path>
                  <path d="M6.45,26.08Z"></path>
                  <path d="M24.9,3.34c.03.12.59,2.29.59,2.29,0,0,.06.18.05.28-.01.09-.07.17-.15.21-.1.05-.3.03-.3.03s-.25-.02-.38-.03c-.21-.02-.41-.03-.62-.05-.22-.02-1.03-.08-1.21-.1-.07,0-.15-.01-.22-.02-.16-.01-.29-.16-.27-.32,0-.07.04-.14.08-.19.06-.06.15-.09.23-.09l1.67.13c-5.26-4.23-12.98-3.9-17.87.98-4.68,4.68-5.18,11.97-1.48,17.21.09.13.07.31-.07.41-.13.09-.32.07-.41-.07C.7,18.6,1.21,10.98,6.1,6.1s13.14-5.44,18.63-1.05l-.4-1.56c-.03-.1,0-.21.08-.28.04-.04.08-.06.14-.08.16-.04.32.06.36.21Z"></path>
                  <path d="M25.55,5.92Z"></path>
                </svg>
                <div className="flex-1">
                  <div
                    className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium"
                    style={fonts.heading}
                  >
                    INTEROPERABILITY
                  </div>
                  <h3
                    className="text-lg font-bold text-gray-900 dark:text-white mb-3"
                    style={fonts.heading}
                  >
                    Cross-Platform Automation
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400" style={fonts.body}>
                    Seamless operation across blockchains and off-chain platforms for DeFi and
                    TradFi
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Read the docs card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 max-w-2xl mx-auto"
          >
            <div className="p-8 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg text-center">
              <h3
                className="text-xl font-semibold text-gray-900 dark:text-white mb-2"
                style={fonts.heading}
              >
                Want to learn more?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4" style={fonts.body}>
                Explore our comprehensive documentation to get started with Vincent
              </p>
              <a
                href="https://docs.heyvincent.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-full border-2 transition-all group hover:gap-3"
                style={{
                  ...fonts.heading,
                  color: '#FF4205',
                  borderColor: '#FF4205',
                }}
              >
                Read the docs
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
            </div>
          </motion.div>
        </div>

        {/* CTA Cards Section */}
        <div className="relative py-12 px-4 md:px-8 w-full">
          <div className="flex flex-col gap-6">
            {/* Row 1: User Card (Explore & Earn) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/10"
            >
              <div className="relative grid grid-cols-1 md:grid-cols-2 min-h-[300px] md:min-h-[500px]">
                {/* Left side - CTA content */}
                <div className="p-8 flex flex-col justify-center order-2 md:order-1">
                  <div
                    className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium"
                    style={fonts.heading}
                  >
                    FOR USERS
                  </div>
                  <div
                    className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3"
                    style={fonts.heading}
                  >
                    Explore & Earn
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4" style={fonts.body}>
                    Browse the marketplace of intelligent finance applications and start earning
                    with automation agents
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                    <button
                      onClick={handleExploreClick}
                      className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-900 dark:text-white hover:gap-3 hover:text-[#FF4205] transition-all group rounded-full border-2 border-gray-900 dark:border-white hover:border-[#FF4205]"
                      style={fonts.heading}
                    >
                      Explore Apps
                      <svg
                        className="w-4 h-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Vertical divider */}
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 dark:bg-white/10 -translate-x-1/2" />

                {/* Right side - mesh gradient with earn preview overlay */}
                <div className="flex items-center justify-center overflow-hidden relative order-1 md:order-2">
                  <img
                    src="/backgrounds/image-mesh-gradient.png"
                    alt="Mesh gradient"
                    className="absolute inset-0 w-full h-full object-cover rounded-r-2xl"
                  />
                  <img
                    src="/backgrounds/earn-preview.png"
                    alt="Earn preview"
                    className="relative z-10 max-h-[250px] md:max-h-[400px] w-auto object-contain py-4 md:py-8"
                  />
                </div>
              </div>
            </motion.div>

            {/* Row 2: Developer Card (Build) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/10"
            >
              <div className="relative grid grid-cols-1 md:grid-cols-2 min-h-[300px] md:min-h-[500px]">
                {/* Left side - mesh gradient with build preview */}
                <div className="flex items-center justify-center overflow-hidden relative">
                  <img
                    src="/backgrounds/image-mesh-gradient.png"
                    alt="Mesh gradient"
                    className="absolute inset-0 w-full h-full object-cover rounded-l-2xl"
                  />
                  <img
                    src="/backgrounds/build-preview.png"
                    alt="Build preview"
                    className="relative z-10 h-full w-auto object-contain px-4 md:px-8 py-4 md:py-8"
                  />
                </div>

                {/* Vertical divider */}
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 dark:bg-white/10 -translate-x-1/2" />

                {/* Right side - CTA content */}
                <div className="p-8 flex flex-col justify-center">
                  <div
                    className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium"
                    style={fonts.heading}
                  >
                    FOR DEVELOPERS
                  </div>
                  <div
                    className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3"
                    style={fonts.heading}
                  >
                    Build
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4" style={fonts.body}>
                    Create and publish apps, abilities, and policies on the Vincent platform
                  </div>
                  <button
                    onClick={handleBuildClick}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-900 dark:text-white hover:gap-3 hover:text-[#FF4205] transition-all group mx-auto rounded-full border-2 border-gray-900 dark:border-white hover:border-[#FF4205]"
                    style={fonts.heading}
                  >
                    Start Building
                    <svg
                      className="w-4 h-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="relative py-12 px-4 md:px-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              label="Total Value Managed"
              value={tvm}
              valuePrefix="$"
              valueSuffix="M+"
              description="Across all chains"
              delay={0.1}
            />
            <StatCard
              label="Total Apps"
              value={totalApps}
              valueSuffix="+"
              description="In the registry"
              delay={0.2}
            />
            <StatCard
              label="Total Abilities"
              value={totalAbilities}
              valueSuffix="+"
              description="Available actions"
              delay={0.3}
            />
          </div>
        </div>

        {/* Partners - in second grid row (mobile only) */}
        <div className="md:hidden py-8">
          <LandingPartners />
        </div>

        {/* Footer */}
        <div className="z-15 pb-1 sm:pb-3">
          <Footer />
        </div>
      </motion.div>
    </>
  );
}
