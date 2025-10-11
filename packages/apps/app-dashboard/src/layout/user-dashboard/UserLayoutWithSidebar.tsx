import { ComponentProps, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AppSidebar } from '@/components/user-dashboard/sidebar/AppSidebar';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/shared/ui/sidebar';
import { Separator } from '@/components/shared/ui/separator';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { AuthenticationErrorScreen } from '@/components/user-dashboard/connect/AuthenticationErrorScreen';
import Loading from '@/components/shared/ui/Loading';
import { useLocation } from 'react-router-dom';
import { Footer } from '@/components/shared/Footer';
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

function UserLayoutWithSidebar({ children, className }: ComponentProps<'div'>) {
  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();
  const location = useLocation();

  // Check if navigating from a transition (e.g., from RootPage)
  const [isTransitioning, setIsTransitioning] = useState(() => {
    return location.state?.fromTransition === true;
  });

  // Delay showing auth screen to prevent flicker during transition
  const [showAuthScreen, setShowAuthScreen] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      // Clear the transition state after a brief delay to allow the loading screen to show
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isTransitioning]);

  useEffect(() => {
    if (isTransitioning) {
      // Don't show auth screen immediately during transition
      setShowAuthScreen(false);
      // Wait a bit before showing auth screen to prevent flicker
      const timer = setTimeout(() => {
        setShowAuthScreen(true);
      }, 300); // Show after transition animation
      return () => clearTimeout(timer);
    } else {
      // Not transitioning, show auth screen immediately
      setShowAuthScreen(true);
    }
  }, [isTransitioning]);

  // Handle authentication at the layout level to prevent duplication
  const isUserAuthed = authInfo?.userPKP && sessionSigs;

  // Common layout wrapper function
  const layoutWrapper = (content: React.ReactNode) => (
    <div
      className={cn(
        `min-h-screen min-w-screen transition-colors duration-500 bg-white dark:bg-gray-950`,
        className,
      )}
      style={{
        backgroundImage: 'var(--bg-gradient)',
        backgroundSize: '24px 24px',
      }}
    >
      <SidebarProvider style={{ '--sidebar-width': '14rem' } as React.CSSProperties}>
        <SidebarOffsetSync />
        <div className="flex h-screen w-full relative z-10">
          <AppSidebar />
          <SidebarInset className="flex-1 overflow-hidden flex flex-col">
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
                {/* Page title/breadcrumb will be rendered here by child pages if needed */}
                <div id="header-breadcrumb"></div>
              </div>
            </header>
            <main className="flex-1 overflow-auto relative overflow-x-hidden flex flex-col">
              {/* Content wrapper to match component structure */}
              <div
                className={`flex-1 w-full p-2 sm:p-4 md:p-6 relative flex justify-center items-start`}
              >
                {content}
              </div>

              {/* Footer */}
              <div className="relative z-10 mt-auto">
                <Footer />
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );

  // Show transition screen during transition - globe stays, auth content fades in on top
  if (isTransitioning) {
    // If user is already authenticated, show loading state during transition
    if (isUserAuthed) {
      return layoutWrapper(<Loading />);
    }

    // If not authenticated, show transition screen with auth form
    return (
      <div
        className="grid grid-rows-[1fr_auto] min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden"
        style={{
          backgroundImage: 'var(--bg-gradient)',
          backgroundSize: '24px 24px',
        }}
      >
        <div className="relative row-start-1 col-start-1">
          {/* Globe is now rendered by parent GlobeLayout */}

          {/* Auth content fades in on top once processing completes */}
          {showAuthScreen && !isProcessing && !isUserAuthed && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none px-4">
              <AuthenticationErrorScreen
                readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
                skipGlobeRender={true}
              />
            </div>
          )}
        </div>
        <div className="row-start-2 z-15 pb-1 sm:pb-3">
          <Footer />
        </div>
      </div>
    );
  }

  if (!isUserAuthed && !isProcessing) {
    return (
      <AuthenticationErrorScreen readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }} />
    );
  }

  if (isProcessing) {
    return layoutWrapper(<Loading />);
  }

  return layoutWrapper(children);
}

export default UserLayoutWithSidebar;
