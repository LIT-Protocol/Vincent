import { ComponentProps } from 'react';
import { useLocation } from 'react-router-dom';
import { useUrlRedirectUri } from '@/hooks/user-dashboard/useUrlRedirectUri';
import { useUserSidebar } from '@/hooks/user-dashboard/useUserSidebar';
import { UserSidebar } from '@/components/user-dashboard/dashboard/Sidebar';
import { cn } from '@/lib/utils';

function UserLayout({ children, className }: ComponentProps<'div'>) {
  const { redirectUri } = useUrlRedirectUri();
  const location = useLocation();

  // Get sidebar state and handlers from custom hook
  const sidebarProps = useUserSidebar();

  // Don't show sidebar on home page or when using redirectUri
  const isHomePage = location.pathname === '/user';

  // Show sidebar when:
  // 1. Not on home page
  // 2. Not using redirectUri (for app consent flows)
  // AuthGuard will handle authentication redirection for protected routes
  const shouldShowSidebar = !isHomePage && !redirectUri;

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {shouldShowSidebar ? (
        <div className="flex min-h-screen">
          {/* Fixed Sidebar */}
          <div className="fixed left-0 top-0 h-screen z-40">
            <UserSidebar {...sidebarProps} />
          </div>

          {/* Main Content with margin to account for fixed sidebar */}
          <div className="main-content-area flex-1 min-h-screen ml-80 transition-all duration-300">
            {children}
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default UserLayout;
