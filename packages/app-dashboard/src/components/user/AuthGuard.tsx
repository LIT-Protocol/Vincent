import { Navigate } from 'react-router-dom';
import { useReadAuthInfo } from '@/components/consent/hooks/useAuthInfo';

/**
 * Utility function for checking authentication status in protected routes
 * Returns a loading spinner, redirect component, or null if authenticated
 */
export function useAuthGuard() {
  const { authInfo, sessionSigs, isProcessing } = useReadAuthInfo();

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!authInfo?.userPKP || !authInfo?.agentPKP || !sessionSigs) {
    return <Navigate to="/user" replace />;
  }

  // Return null if authenticated, allowing the protected content to render
  return null;
}
