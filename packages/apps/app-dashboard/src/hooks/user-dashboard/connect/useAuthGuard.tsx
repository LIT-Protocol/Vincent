import { useNavigate } from 'react-router-dom';
import { useReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';

/**
 * Utility function for checking authentication status in protected routes
 * Returns a loading spinner, redirect component, or null if authenticated
 */
export function useAuthGuard() {
  const { authInfo, sessionSigs, isProcessing } = useReadAuthInfo();
  const navigate = useNavigate();
  const userIsAuthed = authInfo?.userPKP && sessionSigs;
  if (!isProcessing && !userIsAuthed) {
    navigate(`/user`, { replace: true });
  }

  return isProcessing;
}
