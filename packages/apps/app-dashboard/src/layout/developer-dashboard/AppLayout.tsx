import { ComponentProps, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { cn } from '@/lib/utils';
import { DeveloperSidebarWrapper } from '@/components/developer-dashboard/sidebar/DeveloperSidebarWrapper';
import { AuthenticationErrorScreen } from '@/components/user-dashboard/connect/AuthenticationErrorScreen';
import { ResourceNotOwnedError } from '@/components/developer-dashboard/ui/ResourceNotOwnedError';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/shared/ui/sidebar';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { useAppAddressCheck } from '@/hooks/developer-dashboard/app/useAppAddressCheck';
import { useAbilityAddressCheck } from '@/hooks/developer-dashboard/ability/useAbilityAddressCheck';
import { usePolicyAddressCheck } from '@/hooks/developer-dashboard/policy/usePolicyAddressCheck';
import { getCurrentJwt } from '@/hooks/developer-dashboard/useVincentApiWithJWT';
import Loading from '@/components/shared/ui/Loading';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { ExplorerNav } from '@/components/explorer/ui/ExplorerNav';
import { useGlobeOffset } from '@/contexts/GlobeOffsetContext';

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

  // FIRST: Check basic authentication
  const { authInfo, sessionSigs, isProcessing: authLoading, error } = useReadAuthInfo();
  const isAuthenticated = authInfo?.userPKP && sessionSigs;

  // Generate JWT token when authenticated (for store mutations)
  useEffect(() => {
    if (isAuthenticated && authInfo && sessionSigs) {
      getCurrentJwt(authInfo, sessionSigs).catch((error) =>
        console.error('AppLayout: Error creating JWT:', error),
      );
    }
  }, [isAuthenticated, authInfo, sessionSigs]);

  // Always call address check hooks (React hooks rule)
  const appAddressCheck = useAppAddressCheck();
  const abilityAddressCheck = useAbilityAddressCheck();
  const policyAddressCheck = usePolicyAddressCheck();

  // Check if we're on any developer route
  const isDeveloperRoute = location.pathname.startsWith('/developer');

  // Determine which specific authorization check is needed based on route
  const needsAppAuthorization = location.pathname.includes('/developer/apps/appId/');
  const needsAbilityAuthorization = location.pathname.includes('/developer/abilities/ability/');
  const needsPolicyAuthorization = location.pathname.includes('/developer/policies/policy/');

  // Select the appropriate authorization result based on the current route
  let isResourceAuthorized: boolean | null = true;
  let isResourceChecking = false;

  if (needsAppAuthorization) {
    isResourceAuthorized = appAddressCheck.isAuthorized;
    isResourceChecking = appAddressCheck.isChecking;
  } else if (needsAbilityAuthorization) {
    isResourceAuthorized = abilityAddressCheck.isAuthorized;
    isResourceChecking = abilityAddressCheck.isChecking;
  } else if (needsPolicyAuthorization) {
    isResourceAuthorized = policyAddressCheck.isAuthorized;
    isResourceChecking = policyAddressCheck.isChecking;
  }

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
        <div className="flex h-screen w-full relative z-10 pt-16">
          <DeveloperSidebarWrapper />
          <SidebarInset className="flex-1 overflow-hidden flex flex-col">
            <main className="flex-1 overflow-auto relative overflow-x-hidden flex flex-col">
              <div className="flex-1 w-full p-2 sm:p-4 md:p-6 pt-6 sm:pt-8 relative">{content}</div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );

  // Early returns for error and loading states
  if (isDeveloperRoute && !authLoading && !isAuthenticated) {
    return (
      <AuthenticationErrorScreen
        readAuthInfo={{ authInfo, sessionSigs, isProcessing: authLoading, error }}
      />
    );
  }

  if (isDeveloperRoute && authLoading) {
    return layoutWrapper(<Loading />);
  }

  if (
    (needsAppAuthorization || needsAbilityAuthorization || needsPolicyAuthorization) &&
    isResourceChecking
  ) {
    return layoutWrapper(<Loading />);
  }

  if (
    (needsAppAuthorization || needsAbilityAuthorization || needsPolicyAuthorization) &&
    isResourceAuthorized === false
  ) {
    const resourceType = needsAppAuthorization
      ? 'app'
      : needsAbilityAuthorization
        ? 'ability'
        : 'policy';

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
