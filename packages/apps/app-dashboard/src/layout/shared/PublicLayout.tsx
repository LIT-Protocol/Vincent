import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Footer } from '@/components/shared/Footer';
import { useEffect } from 'react';

function PublicLayout() {
  const location = useLocation();

  useEffect(() => {
    console.log('[PublicLayout] Rendered for path:', location.pathname);
  }, [location.pathname]);

  console.log('[PublicLayout] Rendering footer for:', location.pathname);

  return (
    <div
      className={cn(
        'grid grid-rows-[1fr_auto] min-h-screen overflow-x-hidden bg-white dark:bg-gray-950',
      )}
      style={{
        backgroundImage: 'var(--bg-gradient)',
        backgroundSize: '24px 24px',
      }}
    >
      <main className="row-start-1 col-start-1 relative z-10 px-4 py-2 sm:p-4 md:p-6">
        <Outlet />
      </main>
      <div className="row-start-2 z-15">
        <Footer />
      </div>
    </div>
  );
}

export default PublicLayout;
