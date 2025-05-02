import { useNavigate } from 'react-router-dom';
import { useReadAuthInfo } from '@/components/consent/hooks/useAuthInfo';

/**
 * Utility function for checking authentication status in protected routes
 * Returns a loading spinner, redirect component, or null if authenticated
 */
export function useAuthGuard() {
  const { authInfo, sessionSigs, isProcessing } = useReadAuthInfo();
  const navigate = useNavigate();
  const userIsAuthed = authInfo?.userPKP && authInfo?.agentPKP && sessionSigs;
  if (!isProcessing && !userIsAuthed) {
    navigate(`/user`, { replace: true });
  }

  return isProcessing;
}
