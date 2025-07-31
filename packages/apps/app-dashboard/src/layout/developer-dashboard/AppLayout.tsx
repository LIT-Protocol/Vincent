import { ComponentProps, useEffect } from 'react';
import { useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import { DeveloperSidebarWrapper } from '@/components/developer-dashboard/sidebar/DeveloperSidebarWrapper';
import { AuthenticationErrorScreen } from '@/components/user-dashboard/connect/AuthenticationErrorScreen';
import { ResourceNotOwnedError } from '@/components/developer-dashboard/ui/ResourceNotOwnedError';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/shared/ui/sidebar';
import { Separator } from '@/components/shared/ui/separator';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { useAppAddressCheck } from '@/hooks/developer-dashboard/app/useAppAddressCheck';
import { useAbilityAddressCheck } from '@/hooks/developer-dashboard/ability/useAbilityAddressCheck';
import { usePolicyAddressCheck } from '@/hooks/developer-dashboard/policy/usePolicyAddressCheck';
import { getCurrentJwt } from '@/hooks/developer-dashboard/useVincentApiWithJWT';
import Loading from '@/components/shared/ui/Loading';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';

function AppLayout({ children, className }: ComponentProps<'div'>) {
  const location = useLocation();

  // FIRST: Check basic authentication
  const { authInfo, sessionSigs, isProcessing: authLoading, error } = useReadAuthInfo();
  const isAuthenticated = authInfo?.agentPKP && sessionSigs;

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
  const needsAppAuthorization = location.pathname.includes('/developer/appId/');
  const needsAbilityAuthorization = location.pathname.includes('/developer/ability/');
  const needsPolicyAuthorization = location.pathname.includes('/developer/policy/');

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
    <div className={cn(`min-h-screen min-w-screen ${theme.bg}`, className)}>
      <SidebarProvider style={{ '--sidebar-width': '20rem' } as React.CSSProperties}>
        <DeveloperSidebarWrapper />
        <SidebarInset>
          <header className="border-b border-sidebar-border h-16">
            <div className="flex items-center gap-2 px-6 py-4 h-full">
              <SidebarTrigger className="text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-white/5 [&>svg]:text-gray-900 dark:[&>svg]:text-white -ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
            </div>
          </header>
          <main className="flex-1 p-8 flex justify-center items-start">
            <div className="w-full">
              <div className="max-w-6xl mx-auto">{content}</div>
            </div>
          </main>
        </SidebarInset>
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
