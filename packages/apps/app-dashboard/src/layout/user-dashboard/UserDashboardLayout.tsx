import { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { useTheme } from '@/providers/ThemeProvider';

function UserDashboardLayout({ children, className }: ComponentProps<'div'>) {
  const { isDark } = useTheme();
  const themeStyles = theme(isDark);

  return (
    <div
      className={cn(
        `min-h-screen min-w-screen transition-colors duration-500 ${themeStyles.bg}`,
        className,
      )}
    >
      <main className="flex-1 sm:px-4 flex justify-center">{children}</main>
    </div>
  );
}

export default UserDashboardLayout;
