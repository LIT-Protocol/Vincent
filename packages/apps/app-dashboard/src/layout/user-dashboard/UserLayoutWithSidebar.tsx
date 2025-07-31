import { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { SidebarWrapper } from '@/components/user-dashboard/sidebar/SidebarWrapper';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/shared/ui/sidebar';
import { Separator } from '@/components/shared/ui/separator';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { AuthenticationErrorScreen } from '@/components/user-dashboard/connect/AuthenticationErrorScreen';
import { ThemedLoading } from '@/components/user-dashboard/dashboard/ui/ThemedLoading';

function UserLayoutWithSidebar({ children, className }: ComponentProps<'div'>) {
  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();

  // Handle authentication at the layout level to prevent duplication
  const isUserAuthed = authInfo?.userPKP && authInfo?.agentPKP && sessionSigs;

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
            <main className="flex-1 overflow-auto">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default UserLayoutWithSidebar;
