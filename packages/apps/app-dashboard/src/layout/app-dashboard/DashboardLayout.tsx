import { ReactNode } from 'react';
import { DashboardProvider } from '../../components/app-dashboard/DashboardContext';
import { useWalletProtection } from '../../hooks/app-dashboard/useWalletProtection';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isConnected } = useWalletProtection();

  // Don't render anything if not connected (while redirecting)
  if (!isConnected) {
    return null;
  }

  return (
      <DashboardProvider>
        <div className="p-6">{children}</div>
      </DashboardProvider>
  );
}
