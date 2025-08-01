import { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { SidebarWrapper } from '@/components/user-dashboard/sidebar/SidebarWrapper';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/shared/ui/sidebar';
import { Separator } from '@/components/shared/ui/separator';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { AuthenticationErrorScreen } from '@/components/user-dashboard/connect/AuthenticationErrorScreen';
import { ThemedLoading } from '@/components/user-dashboard/dashboard/ui/ThemedLoading';

function UserLayoutWithSidebar({ children, className }: ComponentProps<'div'>) {
  const { isDark } = useTheme();
  const themeStyles = theme(isDark);
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
        `min-h-screen min-w-screen transition-colors duration-500 ${themeStyles.bg}`,
        className,
      )}
    >
      <SidebarProvider>
        <SidebarWrapper />
        <SidebarInset>
          <header className="border-b border-sidebar-border h-16">
            <div className="flex items-center gap-2 px-6 py-4 h-full">
              <SidebarTrigger
                className={`-ml-1 ${isDark ? 'text-white hover:bg-white/5 [&>svg]:text-white' : 'text-gray-900 hover:bg-gray-100 [&>svg]:text-gray-900'}`}
              />
              <Separator orientation="vertical" className="mr-2 h-4" />
            </div>
          </header>
          <main className="flex-1 sm:p-8 flex justify-start items-start">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default UserLayoutWithSidebar;
