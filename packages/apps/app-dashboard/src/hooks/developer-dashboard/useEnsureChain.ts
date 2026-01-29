import { useState, useEffect, useCallback } from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

interface UseEnsureChainResult {
  /**
   * Ensures the user is on Base Sepolia before proceeding.
   * Returns true if already on correct chain (safe to proceed).
   * Returns false if chain was switched (caller should return early and let user retry).
   * Throws an error if switch failed.
   */
  ensureChain: (actionName: string) => Promise<boolean>;
  /** Info message to display (e.g., "Switched to Base Sepolia. Please click X again.") */
  infoMessage: string | null;
  /** Clear the info message manually */
  clearInfoMessage: () => void;
  /** Current chain ID */
  chainId: number;
  /** Whether currently on Base Sepolia */
  isOnBaseSepolia: boolean;
}

/**
 * Hook to ensure the user is on Base Sepolia before performing on-chain operations.
 *
 * Usage:
 * ```tsx
 * const { ensureChain, infoMessage } = useEnsureChain();
 *
 * const handleSubmit = async () => {
 *   const canProceed = await ensureChain('Register App On-Chain');
 *   if (!canProceed) return; // Chain was switched, user needs to click again
 *
 *   // Continue with on-chain operation...
 * };
 *
 * return (
 *   <>
 *     {infoMessage && <StatusMessage message={infoMessage} type="info" />}
 *     <Button onClick={handleSubmit}>Register App On-Chain</Button>
 *   </>
 * );
 * ```
 */
export function useEnsureChain(): UseEnsureChainResult {
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const isOnBaseSepolia = chainId === baseSepolia.id;

  // Clear info messages after 5 seconds
  useEffect(() => {
    if (!infoMessage) return;

    const timer = setTimeout(() => {
      setInfoMessage(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [infoMessage]);

  const clearInfoMessage = useCallback(() => {
    setInfoMessage(null);
  }, []);

  const ensureChain = useCallback(
    async (actionName: string): Promise<boolean> => {
      if (chainId === baseSepolia.id) {
        return true; // Already on correct chain, safe to proceed
      }

      try {
        await switchChainAsync({ chainId: baseSepolia.id });
        // Switch successful - tell user to retry
        setInfoMessage(`Switched to Base Sepolia. Please click "${actionName}" again to continue.`);
        return false; // Switched, caller should return early
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('user rejected')) {
          throw new Error('Please switch to Base Sepolia to continue.');
        } else {
          throw new Error('Failed to switch network. Please switch to Base Sepolia manually.');
        }
      }
    },
    [chainId, switchChainAsync],
  );

  return {
    ensureChain,
    infoMessage,
    clearInfoMessage,
    chainId,
    isOnBaseSepolia,
  };
}
