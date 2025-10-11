import { Outlet, useLocation } from 'react-router-dom';
import DitheredGlobe from '@/components/shared/DitheredGlobe';
import { GlobeOffsetProvider, useGlobeOffset } from '@/contexts/GlobeOffsetContext';

/**
 * Persistent layout that keeps the DitheredGlobe mounted across route changes.
 * The globe stays rendered while child routes change via <Outlet />.
 */
function GlobeLayoutInner() {
  const location = useLocation();
  const { shouldOffset } = useGlobeOffset();

  // Check if we should show the globe (only on specific routes)
  const showGlobe = location.pathname === '/' || location.pathname.startsWith('/user/');

  return (
    <>
      {/* Persistent globe layer - stays mounted across route changes */}
      {showGlobe && (
        <div
          key="globe-container"
          className="fixed inset-0 transition-all duration-300"
          style={{
            zIndex: 0,
            // On desktop with sidebar open, offset the globe to center it in the main content area
            left: shouldOffset ? '7rem' : '0',
          }}
        >
          <DitheredGlobe key="persistent-globe" />
        </div>
      )}

      {/* Child routes render here - no wrapper to avoid blocking globe */}
      <Outlet />
    </>
  );
}

export default function GlobeLayout() {
  return (
    <GlobeOffsetProvider>
      <GlobeLayoutInner />
    </GlobeOffsetProvider>
  );
}
