import { ReactNode } from 'react';
import { DashboardProvider } from '../../components/app-dashboard/DashboardContext';
import { DashboardErrorBoundary } from '../../components/app-dashboard/DashboardErrorBoundary';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardErrorBoundary>
      <DashboardProvider>
        <div className="p-6">{children}</div>
      </DashboardProvider>
    </DashboardErrorBoundary>
  );
}
