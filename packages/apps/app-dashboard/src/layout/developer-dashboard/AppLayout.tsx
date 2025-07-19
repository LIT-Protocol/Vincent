import { ComponentProps } from 'react';
import { useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import { DeveloperSidebarWrapper } from '@/components/developer-dashboard/sidebar/DeveloperSidebarWrapper';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { AuthenticationErrorScreen } from '@/components/user-dashboard/consent/AuthenticationErrorScreen';
import { ThemedLoading } from '@/components/user-dashboard/dashboard/ui/ThemedLoading';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/shared/ui/sidebar';
import { Separator } from '@/components/shared/ui/separator';
import { useTheme } from '@/providers/ThemeProvider';
import Header from '../../components/developer-dashboard/ui/Header';

function AppLayout({ children, className }: ComponentProps<'div'>) {
  const location = useLocation();
  const { isDark } = useTheme();
  const { authInfo, sessionSigs, isProcessing } = useReadAuthInfo();

  // Check if user is authenticated with PKP
  const isUserAuthed = authInfo?.userPKP && authInfo?.agentPKP && sessionSigs;

  const isDeveloperRoute = location.pathname.includes('developer');

  // Show loading spinner while processing authentication
  if (isProcessing) {
    return <ThemedLoading />;
  }

  // Show authentication error for developer routes that need auth (not the connect wallet page)
  if (isDeveloperRoute && !isUserAuthed) {
    return <AuthenticationErrorScreen />;
  }

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

  // For non-authenticated developer routes (connect wallet page), show simple layout
  if (!isUserAuthed) {
    return (
      <div className={cn('min-h-screen min-w-screen flex flex-col align-center', className)}>
        <main className="flex-1 p-8">{children}</main>
      </div>
    );
  }

  // Render sidebar-based layout for authenticated developer routes
  return (
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
              <div className="max-w-6xl mx-auto">{children}</div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default AppLayout;
