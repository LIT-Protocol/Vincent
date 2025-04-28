import { useCallback } from 'react';

interface UseConsentDisapprovalProps {
  redirectUri: string | null;
  onStatusChange?: (message: string, type: 'info' | 'warning' | 'success' | 'error') => void;
  onError?: (error: any, title?: string, details?: string) => void;
  redirectDelay?: number;
}

export const useConsentDisapproval = ({
  redirectUri,
  onStatusChange,
  onError,
  redirectDelay = 2000,
}: UseConsentDisapprovalProps) => {
  /**
   * Handle the disapproval action
   * @returns A promise that resolves when the disapproval process is complete
   */
  const disapproveConsent = useCallback(async () => {
    try {
      onStatusChange?.('Processing disapproval...', 'info');
      await new Promise((resolve) => setTimeout(resolve, redirectDelay));

      if (redirectUri) {
        onStatusChange?.('Redirecting back to app...', 'info');

        return {
          success: true,
          redirectUri,
        };
      } else {
        onStatusChange?.('No redirect URI available', 'error');
        return { success: false, message: 'No redirect URI available for redirect' };
      }
    } catch (err) {
      console.error('Error disapproving consent:', err);
      const errorMessage = 'Failed to disapprove. Please try again.';
      onError?.(errorMessage, 'Disapproval Failed');
      return { success: false, message: errorMessage };
    }
  }, [redirectUri, redirectDelay, onStatusChange, onError]);

  /**
   * Execute the redirect after disapproval
   * @param uri The URI to redirect to
   */
  const executeRedirect = useCallback((uri: string) => {
    window.location.href = uri;
  }, []);

  return {
    disapproveConsent,
    executeRedirect,
  };
};
