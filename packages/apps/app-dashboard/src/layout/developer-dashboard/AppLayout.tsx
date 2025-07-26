import { ComponentProps } from 'react';
import { useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/developer-dashboard/sidebar/Sidebar';
import { useAppSidebar } from '@/hooks/developer-dashboard/app/useAppSidebar';
import { useWalletProtection } from '@/hooks/developer-dashboard/useWalletProtection';
import Header from '../../components/developer-dashboard/ui/Header';

function AppLayout({ children, className }: ComponentProps<'div'>) {
  // Protect layout with wallet connection requirement
  useWalletProtection();

  const location = useLocation();
  const sidebarProps = useAppSidebar();

  // FIXME: Before the developer dashboard is rolled out, we should still display this on the
  // existing dashboard page.
  const isDeveloperRoute = location.pathname.includes('developer');

  const shouldShowSidebar = isDeveloperRoute && sidebarProps.shouldShowSidebar;

  if (!isDeveloperRoute) {
    return (
      <div className={cn('min-h-screen min-w-screen flex flex-col align-center', className)}>
        <Header />
        <main className="min-h-screen mx-auto flex flex-col align-center max-w-screen-xl xl:w-screen p-8">
          {children}
        </main>
      </div>
    );
  }

  // Render sidebar-based layout for developer routes
  return (
    <div className={cn('min-h-screen min-w-screen bg-gray flex', className)}>
      {shouldShowSidebar && <Sidebar {...sidebarProps} />}
      <div
        className={`main-content-area flex-1 overflow-auto transition-all duration-300 ${shouldShowSidebar ? 'ml-80' : ''}`}
      >
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

export default AppLayout;
