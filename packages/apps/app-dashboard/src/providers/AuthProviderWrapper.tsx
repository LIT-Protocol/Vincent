import { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/developer-dashboard/useAuth';

export default function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
