import { ReactNode } from 'react';
import { AppDetailProvider } from '../../components/app-dashboard/AppDetailContext';

interface AppDetailLayoutProps {
  children: ReactNode;
}

export function AppDetailLayout({ children }: AppDetailLayoutProps) {
  return (
    <AppDetailProvider>
      <div className="p-6">{children}</div>
    </AppDetailProvider>
  );
}
