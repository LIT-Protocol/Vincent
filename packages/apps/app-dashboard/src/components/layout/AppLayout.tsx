import { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/developer-dashboard/Sidebar';
import { useAppSidebar } from '@/hooks/developer-dashboard/useAppSidebar';
import { useDashboardData } from '@/hooks/developer-dashboard/useDashboardData';
import { useWalletProtection } from '@/hooks/developer-dashboard/useWalletProtection';

function AppLayout({ children, className }: ComponentProps<'div'>) {
  // Protect layout with wallet connection requirement
  useWalletProtection();

  const { apps, tools, policies } = useDashboardData();
  const sidebarProps = useAppSidebar();

  return (
    <div className={cn('min-h-screen min-w-screen bg-gray flex', className)}>
      {sidebarProps.shouldShowSidebar && (
        <Sidebar {...sidebarProps} apps={apps} tools={tools} policies={policies} />
      )}
      <div className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

export default AppLayout;
