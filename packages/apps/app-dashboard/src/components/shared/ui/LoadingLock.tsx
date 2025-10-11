import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { useRef, useEffect, useState } from 'react';

interface LoadingLockProps {
  text?: string;
}

const lockDots = [
  // Shackle - left vertical (bottom to top) - more dots
  { x: 4, y: 12 },
  { x: 4, y: 11.5 },
  { x: 4, y: 11 },
  { x: 4, y: 10.5 },
  { x: 4, y: 10 },
  { x: 4, y: 9.5 },
  { x: 4, y: 9 },
  { x: 4, y: 8.5 },
  { x: 4, y: 8 },
  { x: 4, y: 7.5 },
  { x: 4, y: 7 },
  { x: 4, y: 6.5 },
  { x: 4, y: 6 },
  // Shackle - top left curve - more dots
  { x: 4.5, y: 5 },
  { x: 5, y: 4.5 },
  { x: 5.5, y: 4 },
  { x: 6, y: 3.5 },
  { x: 6.5, y: 3 },
  { x: 7, y: 2.5 },
  { x: 7.5, y: 2.2 },
  { x: 8, y: 2 },
  // Shackle - top horizontal - more dots
  { x: 9, y: 2 },
  { x: 10, y: 2 },
  { x: 11, y: 2 },
  { x: 12, y: 2 },
  { x: 13, y: 2 },
  { x: 14, y: 2 },
  { x: 15, y: 2 },
  { x: 16, y: 2 },
  { x: 17, y: 2 },
  // Shackle - top right curve - more dots
  { x: 17.5, y: 2.2 },
  { x: 18, y: 2.5 },
  { x: 18.5, y: 3 },
  { x: 19, y: 3.5 },
  { x: 19.5, y: 4 },
  { x: 20, y: 4.5 },
  { x: 20, y: 5 },
  // Shackle - right vertical - more dots
  { x: 20, y: 6 },
  { x: 20, y: 6.5 },
  { x: 20, y: 7 },
  { x: 20, y: 7.5 },
  { x: 20, y: 8 },
  { x: 20, y: 8.5 },
  { x: 20, y: 9 },
  { x: 20, y: 9.5 },
  { x: 20, y: 10 },
  { x: 20, y: 10.5 },
  { x: 20, y: 11 },
  { x: 20, y: 11.5 },
  { x: 20, y: 12 },

  // Lock body - top edge - more dots
  { x: 19, y: 14 },
  { x: 18, y: 14 },
  { x: 17, y: 14 },
  { x: 16, y: 14 },
  { x: 15, y: 14 },
  { x: 14, y: 14 },
  { x: 13, y: 14 },
  { x: 12, y: 14 },
  { x: 11, y: 14 },
  { x: 10, y: 14 },
  { x: 9, y: 14 },
  { x: 8, y: 14 },
  { x: 7, y: 14 },
  { x: 6, y: 14 },
  { x: 5, y: 14 },

  // Lock body - left edge - more dots
  { x: 4, y: 15 },
  { x: 4, y: 16 },
  { x: 4, y: 17 },
  { x: 4, y: 18 },
  { x: 4, y: 19 },
  { x: 4, y: 20 },
  { x: 4, y: 21 },
  { x: 4, y: 22 },
  { x: 4, y: 23 },
  { x: 4, y: 24 },
  { x: 4, y: 25 },
  { x: 4, y: 26 },
  // Lock body - bottom left corner
  { x: 4.5, y: 26.5 },
  { x: 5, y: 27 },
  { x: 5.5, y: 27.5 },
  { x: 6, y: 28 },
  // Lock body - bottom edge - more dots
  { x: 7, y: 28 },
  { x: 8, y: 28 },
  { x: 9, y: 28 },
  { x: 10, y: 28 },
  { x: 11, y: 28 },
  { x: 12, y: 28 },
  { x: 13, y: 28 },
  { x: 14, y: 28 },
  { x: 15, y: 28 },
  { x: 16, y: 28 },
  { x: 17, y: 28 },
  { x: 18, y: 28 },
  // Lock body - bottom right corner
  { x: 18.5, y: 27.5 },
  { x: 19, y: 27 },
  { x: 19.5, y: 26.5 },
  // Lock body - right edge - more dots
  { x: 20, y: 26 },
  { x: 20, y: 25 },
  { x: 20, y: 24 },
  { x: 20, y: 23 },
  { x: 20, y: 22 },
  { x: 20, y: 21 },
  { x: 20, y: 20 },
  { x: 20, y: 19 },
  { x: 20, y: 18 },
  { x: 20, y: 17 },
  { x: 20, y: 16 },
  { x: 20, y: 15 },
];

const keyholeDots = [
  // Keyhole - circle part (top) - denser
  { x: 11.5, y: 18 },
  { x: 12.5, y: 18 },
  { x: 10.5, y: 18.5 },
  { x: 13.5, y: 18.5 },
  { x: 10, y: 19 },
  { x: 14, y: 19 },
  { x: 10.5, y: 19.5 },
  { x: 13.5, y: 19.5 },
  { x: 11, y: 20 },
  { x: 11.5, y: 20 },
  { x: 12.5, y: 20 },
  { x: 13, y: 20 },
  // Keyhole - vertical line (bottom) - more dots
  { x: 12, y: 20.5 },
  { x: 12, y: 21 },
  { x: 12, y: 21.5 },
  { x: 12, y: 22 },
  { x: 12, y: 22.5 },
  { x: 12, y: 23 },
];

export default function LoadingLock({ text }: LoadingLockProps) {
  const totalDots = lockDots.length;
  const animationDuration = 1.5; // seconds (1500ms)
  const animationDurationMs = animationDuration * 1000;

  // Calculate the animation offset to make it appear continuous across remounts
  const mountTimeRef = useRef<number>(Date.now());
  const [animationOffset, setAnimationOffset] = useState<number>(0);

  useEffect(() => {
    // Calculate how many milliseconds into the animation cycle we are
    const elapsed = Date.now() - mountTimeRef.current;
    const offset = -(elapsed % animationDurationMs) / 1000; // Convert back to seconds
    setAnimationOffset(offset);
  }, [animationDurationMs]);

  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16">
      {/* Lock dot chase loader - scales based on screen size */}
      <div
        className="relative scale-100 sm:scale-125 lg:scale-150"
        style={{ width: '48px', height: '60px' }}
      >
        {/* Animated lock outline */}
        {lockDots.map((dot, index) => {
          // Combine the per-dot delay with the global animation offset
          const dotDelay = -(index / totalDots) * animationDuration;
          const totalDelay = dotDelay + animationOffset;
          return (
            <div
              key={`lock-${index}`}
              className="absolute rounded-full"
              style={{
                width: '1px',
                height: '1px',
                left: `${dot.x * 1.5}px`,
                top: `${dot.y * 1.5}px`,
                backgroundColor: theme.brandOrange,
                animation: `dotChase ${animationDuration}s ease-in-out ${totalDelay}s infinite`,
              }}
            />
          );
        })}

        {/* Static keyhole */}
        {keyholeDots.map((dot, index) => (
          <div
            key={`keyhole-${index}`}
            className="absolute rounded-full"
            style={{
              width: '1px',
              height: '1px',
              left: `${dot.x * 1.5}px`,
              top: `${dot.y * 1.5}px`,
              backgroundColor: theme.brandOrange,
              opacity: 0.8,
            }}
          />
        ))}
      </div>
      {text && (
        <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-900 dark:text-white font-normal">
          {text}
        </p>
      )}

      <style>{`
        @keyframes dotChase {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          40%, 60% {
            opacity: 0.15;
            transform: scale(0.6);
          }
        }
      `}</style>
    </div>
  );
}
