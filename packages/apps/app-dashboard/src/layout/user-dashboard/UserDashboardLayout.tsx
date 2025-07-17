import { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { theme } from '@/components/user-dashboard/consent/ui/theme';
import { useTheme } from '@/providers/ThemeProvider';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { AuthenticationErrorScreen } from '@/components/user-dashboard/consent/AuthenticationErrorScreen';
import { ThemedLoading } from '@/components/user-dashboard/dashboard/ui/ThemedLoading';

function UserDashboardLayout({ children, className }: ComponentProps<'div'>) {
  const { isDark } = useTheme();
  const themeStyles = theme(isDark);
  const { authInfo, sessionSigs, isProcessing } = useReadAuthInfo();

  // Handle authentication at the layout level to prevent duplication
  const isUserAuthed = authInfo?.userPKP && authInfo?.agentPKP && sessionSigs;

  if (isProcessing) {
    return <ThemedLoading />;
  }

  if (!isUserAuthed) {
    return <AuthenticationErrorScreen />;
  }

  return (
    <div
      className={cn(
        `min-h-screen min-w-screen transition-colors duration-500 ${themeStyles.bg}`,
        className,
      )}
    >
      <main className="flex-1 p-8 flex justify-center">{children}</main>
    </div>
  );
}

export default UserDashboardLayout;
