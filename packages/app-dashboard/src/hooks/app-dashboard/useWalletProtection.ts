import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook that protects pages by redirecting to /developer if wallet is not connected
 * @returns isConnected - boolean indicating if wallet is connected
 */
export function useWalletProtection() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected) {
      navigate('/developer');
    }
  }, [isConnected, navigate]);

  return { isConnected };
}
