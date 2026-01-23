import { ComponentProps, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/developer-dashboard/sidebar/Sidebar';
import { ResourceNotOwnedError } from '@/components/developer-dashboard/ui/ResourceNotOwnedError';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/shared/ui/sidebar';
import { theme } from '@/lib/themeClasses';
import { useAbilityAddressCheck } from '@/hooks/developer-dashboard/ability/useAbilityAddressCheck';
import { usePolicyAddressCheck } from '@/hooks/developer-dashboard/policy/usePolicyAddressCheck';
import Loading from '@/components/shared/ui/Loading';
import { useAuth } from '@/hooks/developer-dashboard/useAuth';
import { SignInScreen } from '@/components/developer-dashboard/auth/SignInScreen';
import { ExplorerNav } from '@/components/explorer/ui/ExplorerNav';
import { useGlobeOffset } from '@/layout/shared/GlobeOffsetContext';

// Component that updates globe offset based on sidebar state
function SidebarOffsetSync() {
  const { state, isMobile } = useSidebar();
  const { setShouldOffset } = useGlobeOffset();

  useEffect(() => {
    setShouldOffset(!isMobile && state === 'expanded');
  }, [state, isMobile, setShouldOffset]);

  useEffect(() => {
    return () => {
      setShouldOffset(false);
    };
  }, [setShouldOffset]);

  return null;
}

function AppLayout({ children, className }: ComponentProps<'div'>) {
  const location = useLocation();
  const navigate = useNavigate();

  // Check SIWE-based authentication
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Check if we're on any developer route
  const isDeveloperRoute = location.pathname.startsWith('/developer');

  // Determine which specific authorization check is needed based on route
  const needsAbilityAuthorization = location.pathname.includes('/developer/abilities/ability/');
  const needsPolicyAuthorization = location.pathname.includes('/developer/policies/policy/');

  // Only call hooks when needed (React hooks rule - always call, but conditionally use)
  const abilityAddressCheck = useAbilityAddressCheck();
  const policyAddressCheck = usePolicyAddressCheck();

  // Select the appropriate authorization result based on the current route
  // NOTE: App authorization is now handled in AppOverviewWrapper to avoid duplicate on-chain calls
  let isResourceAuthorized: boolean | null = true;
  let isResourceChecking = false;

  if (needsAbilityAuthorization) {
    isResourceAuthorized = abilityAddressCheck.isAuthorized;
    isResourceChecking = abilityAddressCheck.isChecking;
  } else if (needsPolicyAuthorization) {
    isResourceAuthorized = policyAddressCheck.isAuthorized;
    isResourceChecking = policyAddressCheck.isChecking;
  }
  // NOTE: Removed needsAppAuthorization check here - handled in AppOverviewWrapper

  // Common layout wrapper function
  const layoutWrapper = (content: React.ReactNode) => (
    <div
      className={cn(
        `min-h-screen min-w-screen transition-colors duration-500 ${theme.bg}`,
        className,
      )}
      style={{
        backgroundImage: 'var(--bg-gradient)',
        backgroundSize: '24px 24px',
      }}
    >
      <SidebarProvider style={{ '--sidebar-width': '14rem' } as React.CSSProperties}>
        <SidebarOffsetSync />
        <ExplorerNav onNavigate={(path) => navigate(path)} sidebarTrigger={<SidebarTrigger />} />
        <div className="flex h-screen w-full relative z-10 pt-[61px]">
          <Sidebar />
          <SidebarInset className="flex-1 overflow-hidden flex flex-col">
            <main className="flex-1 overflow-auto relative overflow-x-hidden flex flex-col">
              <div className="flex-1 w-full p-2 sm:p-4 md:p-6 pt-6 sm:pt-8 relative">{content}</div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );

  // Show loading while checking auth
  if (isDeveloperRoute && authLoading) {
    return layoutWrapper(<Loading />);
  }

  // Show sign-in screen if not authenticated on developer routes
  if (isDeveloperRoute && !isAuthenticated) {
    return <SignInScreen />;
  }

  if ((needsAbilityAuthorization || needsPolicyAuthorization) && isResourceChecking) {
    return layoutWrapper(<Loading />);
  }

  if ((needsAbilityAuthorization || needsPolicyAuthorization) && isResourceAuthorized === false) {
    const resourceType = needsAbilityAuthorization ? 'ability' : 'policy';

    return layoutWrapper(
      <ResourceNotOwnedError
        resourceType={resourceType}
        errorDetails={`You don't have permission to access this ${resourceType}. Only the ${resourceType} owner can access this page.`}
      />,
    );
  }

  // Single main return statement for normal flow
  return layoutWrapper(children);
}

export default AppLayout;
