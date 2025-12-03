import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

import { ScrollIndicator } from '@/components/shared/ui/ScrollIndicator';
import { StatCard } from '@/components/shared/ui/StatCard';
import { Footer } from '@/components/shared/Footer';
import LandingPartners from '@/components/shared/LandingPartners';
import { fonts } from '@/components/user-dashboard/connect/ui/theme';
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

  const handleEarnClick = useCallback(() => {
    setIsTransitioning(true);
    // Wait for fade out to complete before navigating
    setTimeout(() => {
      window.scrollTo(0, 0);
      navigate('/user/apps', { state: { fromTransition: true } });
    }, 500);
  }, [navigate]);

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
            className="mb-16 text-center"
          >
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 dark:text-white mb-6"
              style={fonts.heading}
            >
              The Future of Intelligent Finance
            </h2>
            <p
              className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto mb-8 leading-relaxed"
              style={fonts.body}
            >
              Vincent is an automation and delegation platform that enables secure bridging and
              transactions across Solana, EVM, and native Bitcoin for your service, application, or
              AI Agent.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
              <div className="p-6 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-white/10">
                <h3
                  className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                  style={fonts.heading}
                >
                  Decentralized Key Management
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400" style={fonts.body}>
                  Uses Lit Protocol's Programmable Key Pairs to manage agent identities without
                  exposing private keys
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-white/10">
                <h3
                  className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                  style={fonts.heading}
                >
                  Fine-Grained Control
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400" style={fonts.body}>
                  Full authority over policies with verifiable on-chain operations and instant
                  revocation
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-white/10">
                <h3
                  className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                  style={fonts.heading}
                >
                  Cross-Platform Automation
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400" style={fonts.body}>
                  Seamless operation across blockchains and off-chain platforms for DeFi and TradFi
                </p>
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
                    <button
                      onClick={handleEarnClick}
                      className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-900 dark:text-white hover:gap-3 hover:text-[#FF4205] transition-all group rounded-full border-2 border-gray-900 dark:border-white hover:border-[#FF4205]"
                      style={fonts.heading}
                    >
                      Sign Up
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
