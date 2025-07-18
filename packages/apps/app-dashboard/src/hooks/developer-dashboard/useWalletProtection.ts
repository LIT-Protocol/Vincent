import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook that protects pages by redirecting to /developer if wallet is not connected
 * @returns isConnected - boolean indicating if wallet is connected
 */
export function useWalletProtection() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if user is already on the connect wallet page
    if (!isConnected && location.pathname !== '/developer') {
      navigate('/developer');
    }
  }, [isConnected, navigate, location.pathname]);

  return { isConnected };
}
