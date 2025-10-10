import { useState, useEffect } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { theme } from './ui/theme';
import { isDarkMode } from '@/lib/theme';

interface UnifiedConnectSkeletonProps {
  mode: 'auth' | 'consent';
}

export function UnifiedConnectSkeleton({ mode }: UnifiedConnectSkeletonProps) {
  const isDark = isDarkMode();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayMode, setDisplayMode] = useState(mode);

  // Handle mode changes with fade transition
  useEffect(() => {
    if (mode !== displayMode) {
      setIsTransitioning(true);

      // Start fade out, then change content, then fade in
      setTimeout(() => {
        setDisplayMode(mode);
        setIsTransitioning(false);
      }, 250); // Half of the transition duration
    }
  }, [mode, displayMode]);

  return (
    <SkeletonTheme
      baseColor={isDark ? '#404040' : '#f3f4f6'}
      highlightColor={isDark ? '#737373' : '#e5e7eb'}
    >
      {/* Main Card Container - Same dimensions for both modes */}
      <div
        className={`w-full max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden relative z-10 origin-center`}
      >
        {/* Header Skeleton - Same for both modes */}
        <div className={`px-3 sm:px-6 py-3 border-b ${theme.cardBorder}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Skeleton width={16} height={16} />
              <Skeleton height={16} width={120} />
            </div>
            {/* Always show theme toggle, only show user icon in consent mode */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {mode === 'consent' && <Skeleton width={32} height={32} />}
              <Skeleton width={32} height={32} />
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
          {/* App Header Skeleton - Same for both modes */}
          <div className="rounded-xl p-2 sm:p-3">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Skeleton
                width={56}
                height={56}
                className="sm:w-18 sm:h-18 rounded-2xl flex-shrink-0"
              />
              <div className="flex-1 text-center sm:text-left">
                <Skeleton height={24} width={150} className="mb-1" />
                <Skeleton height={16} width={200} />
              </div>
            </div>
          </div>

          {/* Dividing line - Same for both modes */}
          <div className={`border-b ${theme.cardBorder}`}></div>

          {/* Content Cards - Simple fade transition */}
          <div
            className={`space-y-3 transition-opacity duration-500 ease-in-out ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div
              className={`flex flex-col space-y-3 ${displayMode === 'auth' ? 'items-center' : ''}`}
            >
              {displayMode === 'auth' ? (
                // Auth Mode - 4 method cards
                <>
                  {/* Email method */}
                  <div
                    className={`w-full sm:w-3/4 md:w-3/4 lg:w-full py-3 px-4 flex items-center justify-between ${theme.itemBg} border ${theme.cardBorder} rounded-lg`}
                  >
                    <div className="flex items-center">
                      <Skeleton width={20} height={20} className="mr-3 flex-shrink-0" />
                      <Skeleton height={14} width={40} />
                    </div>
                    <Skeleton width={16} height={16} />
                  </div>

                  {/* Phone method */}
                  <div
                    className={`w-full sm:w-3/4 md:w-3/4 lg:w-full py-3 px-4 flex items-center justify-between ${theme.itemBg} border ${theme.cardBorder} rounded-lg`}
                  >
                    <div className="flex items-center">
                      <Skeleton width={20} height={20} className="mr-3 flex-shrink-0" />
                      <Skeleton height={14} width={45} />
                    </div>
                    <Skeleton width={16} height={16} />
                  </div>

                  {/* Wallet method */}
                  <div
                    className={`w-full sm:w-3/4 md:w-3/4 lg:w-full py-3 px-4 flex items-center justify-between ${theme.itemBg} border ${theme.cardBorder} rounded-lg`}
                  >
                    <div className="flex items-center">
                      <Skeleton width={20} height={20} className="mr-3 flex-shrink-0" />
                      <Skeleton height={14} width={42} />
                    </div>
                    <Skeleton width={16} height={16} />
                  </div>

                  {/* Passkey method */}
                  <div
                    className={`w-full sm:w-3/4 md:w-3/4 lg:w-full py-3 px-4 flex items-center justify-between ${theme.itemBg} border ${theme.cardBorder} rounded-lg`}
                  >
                    <div className="flex items-center">
                      <Skeleton width={20} height={20} className="mr-3 flex-shrink-0" />
                      <Skeleton height={14} width={50} />
                    </div>
                    <Skeleton width={16} height={16} />
                  </div>
                </>
              ) : (
                // Consent Mode - 2 permission cards + action buttons
                <>
                  {/* Single Ability Accordion - Closed */}
                  <div
                    className={`w-full backdrop-blur-xl ${theme.itemBg} border ${theme.cardBorder} rounded-lg overflow-hidden`}
                  >
                    <div className="py-2 px-2 sm:py-2.5 sm:px-3">
                      <div className="flex items-center gap-3">
                        {/* Logo */}
                        <Skeleton circle width={28} height={28} />
                        {/* Content */}
                        <div className="flex-1">
                          {/* Title row with npm + ipfs icons */}
                          <div className="flex items-center gap-2">
                            <Skeleton height={14} width={120} />
                            <Skeleton width={16} height={16} />
                            <Skeleton width={16} height={16} />
                          </div>
                          {/* Description */}
                          <Skeleton height={10} width={180} style={{ marginTop: 2 }} />
                        </div>
                        {/* Chevron */}
                        <Skeleton width={20} height={20} />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Section - No card container */}
                  <div className="space-y-4">
                    {/* Trust Warning */}
                    <div className="flex justify-center">
                      <Skeleton height={32} width={280} />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
                      <div className="w-full sm:flex-1">
                        <Skeleton height={36} />
                      </div>
                      <div className="w-full sm:flex-1">
                        <Skeleton height={36} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
