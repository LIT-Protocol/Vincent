import { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { Footer } from '@/components/shared/Footer';

function UserDashboardLayout({ children, className }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid grid-rows-[1fr_auto] min-h-screen overflow-x-hidden bg-white dark:bg-gray-950',
        className,
      )}
      style={{
        backgroundImage: 'var(--bg-gradient)',
        backgroundSize: '24px 24px',
      }}
    >
      <main className="row-start-1 col-start-1 sm:px-4 flex justify-center items-center">
        {children}
      </main>
      <div className="row-start-2 z-15 pb-1 sm:pb-3">
        <Footer />
      </div>
    </div>
  );
}

export default UserDashboardLayout;
