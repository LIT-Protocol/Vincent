import { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { SidebarWrapper } from '@/components/user-dashboard/sidebar/SidebarWrapper';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/shared/ui/sidebar';
import { Separator } from '@/components/shared/ui/separator';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { AuthenticationErrorScreen } from '@/components/user-dashboard/connect/AuthenticationErrorScreen';
import { ThemedLoading } from '@/components/user-dashboard/dashboard/ui/ThemedLoading';
import { useLocation } from 'react-router-dom';

function UserLayoutWithSidebar({ children, className }: ComponentProps<'div'>) {
  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();
  const location = useLocation();

  // Hide SVG backgrounds for certain routes
  const hideSvgBackground =
    location.pathname === '/user/apps' || location.pathname === '/user/wallet';

  // Handle authentication at the layout level to prevent duplication
  const isUserAuthed = authInfo?.userPKP && sessionSigs;

  if (isProcessing) {
    return <ThemedLoading />;
  }

  if (!isUserAuthed) {
    return (
      <AuthenticationErrorScreen readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }} />
    );
  }

  return (
    <div
      className={cn(
        `min-h-screen min-w-screen transition-colors duration-500 ${theme.bg}`,
        className,
      )}
    >
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <SidebarWrapper />
          <SidebarInset className="flex-1 overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
              <div className="flex items-center gap-2 px-3">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
              </div>
            </header>
            <main className="flex-1 overflow-auto relative overflow-x-hidden">
              {/* Static SVGs positioned within content area - persistent across page changes */}
              {!hideSvgBackground && (
                <>
                  <div
                    className="absolute top-0 left-0 w-[600px] h-[600px] z-0 pointer-events-none"
                    style={{
                      backgroundImage: `url('/connect-static-left.svg')`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: 'contain',
                    }}
                  ></div>
                  <div
                    className="absolute top-0 z-0 pointer-events-none"
                    style={{
                      left: 'max(600px, calc(100% - 600px))',
                      width: '600px',
                      height: '600px',
                      backgroundImage: `url('/connect-static-right.svg')`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: 'contain',
                    }}
                  ></div>
                </>
              )}

              {/* Content wrapper to match component structure */}
              <div
                className={`min-h-screen w-full p-2 sm:p-4 md:p-6 relative flex justify-center items-start ${hideSvgBackground ? 'pt-6' : 'pt-24 sm:pt-28 md:pt-32 lg:pt-40'}`}
              >
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default UserLayoutWithSidebar;
