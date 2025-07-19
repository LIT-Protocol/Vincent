import { ComponentProps } from 'react';
import { useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import { DeveloperSidebarWrapper } from '@/components/developer-dashboard/sidebar/DeveloperSidebarWrapper';
import { AuthenticationErrorScreen } from '@/components/user-dashboard/consent/AuthenticationErrorScreen';
import { GeneralErrorScreen } from '@/components/user-dashboard/consent/GeneralErrorScreen';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/shared/ui/sidebar';
import { Separator } from '@/components/shared/ui/separator';
import { useTheme } from '@/providers/ThemeProvider';
import { useAppAddressCheck } from '@/hooks/developer-dashboard/app/useAppAddressCheck';
import { useToolAddressCheck } from '@/hooks/developer-dashboard/tool/useToolAddressCheck';
import { usePolicyAddressCheck } from '@/hooks/developer-dashboard/policy/usePolicyAddressCheck';
import Loading from '@/components/shared/ui/Loading';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';

function AppLayout({ children, className }: ComponentProps<'div'>) {
  const location = useLocation();
  const { isDark } = useTheme();

  // FIRST: Check basic authentication
  const { authInfo, sessionSigs, isProcessing: authLoading } = useReadAuthInfo();
  const isAuthenticated = authInfo?.agentPKP && sessionSigs;

  // Always call address check hooks (React hooks rule)
  const appAddressCheck = useAppAddressCheck();
  const toolAddressCheck = useToolAddressCheck();
  const policyAddressCheck = usePolicyAddressCheck();

  // Check if we're on any developer route
  const isDeveloperRoute = location.pathname.startsWith('/developer');

  // Determine which specific authorization check is needed based on route
  const needsAppAuthorization = location.pathname.includes('/developer/appId/');
  const needsToolAuthorization = location.pathname.includes('/developer/toolId/');
  const needsPolicyAuthorization = location.pathname.includes('/developer/policyId/');

  // Select the appropriate authorization result based on the current route
  let isResourceAuthorized: boolean | null = true;
  let isResourceChecking = false;

  if (needsAppAuthorization) {
    isResourceAuthorized = appAddressCheck.isAuthorized;
    isResourceChecking = appAddressCheck.isChecking;
  } else if (needsToolAuthorization) {
    isResourceAuthorized = toolAddressCheck.isAuthorized;
    isResourceChecking = toolAddressCheck.isChecking;
  } else if (needsPolicyAuthorization) {
    isResourceAuthorized = policyAddressCheck.isAuthorized;
    isResourceChecking = policyAddressCheck.isChecking;
  }

  // Get resource type for error message
  const getResourceType = () => {
    if (needsAppAuthorization) return 'app';
    if (needsToolAuthorization) return 'tool';
    if (needsPolicyAuthorization) return 'policy';
    return 'resource';
  };

  // Common layout wrapper function
  const layoutWrapper = (content: React.ReactNode) => (
    <div className={cn('min-h-screen min-w-screen bg-gray flex', className)}>
      <SidebarProvider style={{ '--sidebar-width': '20rem' } as React.CSSProperties}>
        <DeveloperSidebarWrapper />
        <SidebarInset>
          <header className="border-b border-sidebar-border h-16">
            <div className="flex items-center gap-2 px-6 py-4 h-full">
              <SidebarTrigger
                className={`-ml-1 ${isDark ? 'text-white hover:bg-white/5 [&>svg]:text-white' : 'text-gray-900 hover:bg-gray-100 [&>svg]:text-gray-900'}`}
              />
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
    return <AuthenticationErrorScreen />;
  }

  if (isDeveloperRoute && authLoading) {
    return layoutWrapper(<Loading />);
  }

  if (
    (needsAppAuthorization || needsToolAuthorization || needsPolicyAuthorization) &&
    isResourceChecking
  ) {
    return layoutWrapper(<Loading />);
  }

  if (
    (needsAppAuthorization || needsToolAuthorization || needsPolicyAuthorization) &&
    isResourceAuthorized === false
  ) {
    return layoutWrapper(
      <GeneralErrorScreen
        errorDetails={`You don't have permission to access this ${getResourceType()}. Only the ${getResourceType()} owner can access this page.`}
      />,
    );
  }

  // Single main return statement for normal flow
  return layoutWrapper(children);
}

export default AppLayout;
