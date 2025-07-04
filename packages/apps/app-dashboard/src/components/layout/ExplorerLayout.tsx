import { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import Header from '@/components/explorer/ui/Header';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

function ExplorerLayoutInner({ children, className }: ComponentProps<'div'>) {
  const { theme } = useTheme();

  return (
    <div className={cn(`min-h-screen transition-colors duration-500 ${theme.bg}`, className)}>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header with Navigation */}
        <Header />

        {/* Main Content */}
        {children}
      </div>
    </div>
  );
}

function ExplorerLayout({ children, className }: ComponentProps<'div'>) {
  return (
    <ThemeProvider>
      <ExplorerLayoutInner className={className}>{children}</ExplorerLayoutInner>
    </ThemeProvider>
  );
}

export default ExplorerLayout;
