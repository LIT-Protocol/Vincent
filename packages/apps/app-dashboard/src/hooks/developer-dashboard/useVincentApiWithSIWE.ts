import { useCallback, useState, useEffect, useRef } from 'react';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage, generateNonce } from 'siwe';
import { yellowstone } from '@/config/chains';

/**
 * SIWE validation and authentication utilities
 */
interface SIWEData {
  message: string;
  signature: string;
  address: string;
}

const SIWE_STORAGE_KEY = 'vincentDeveloperSIWE';
const SIWE_EXPIRATION_HOURS = 72;

/**
 * Get current SIWE token for request headers
 */
export const getCurrentSIWEToken = (): string | null => {
  const storedSIWE = localStorage.getItem(SIWE_STORAGE_KEY);
  if (storedSIWE) {
    try {
      const siweData: SIWEData = JSON.parse(storedSIWE);
      return siweData.signature;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Validates SIWE data from localStorage. Just return true/false, if false, the user can just sign a new SIWE. No need for displaying an error message.
 */
const validateSIWEData = async (siweData: SIWEData, currentAddress: string): Promise<boolean> => {
  try {
    const siweMessage = new SiweMessage(siweData.message);

    // Check address match first, critical for security
    if (siweMessage.address.toLowerCase() !== currentAddress.toLowerCase()) return false;

    const result = await siweMessage.verify({
      signature: siweData.signature,
      domain: window.location.hostname,
      time: new Date().toISOString(),
    });

    return result.success;
  } catch (error) {
    return false;
  }
};

/**
 * Generates a new SIWE message
 */
const generateSIWEMessage = (address: string): SiweMessage => {
  const expirationTime = new Date(Date.now() + SIWE_EXPIRATION_HOURS * 60 * 60 * 1000);

  return new SiweMessage({
    domain: window.location.hostname,
    address,
    statement: 'Vincent Developer Registry Access',
    uri: window.location.origin,
    version: '1',
    chainId: yellowstone.id,
    nonce: generateNonce(),
    issuedAt: new Date().toISOString(),
    expirationTime: expirationTime.toISOString(),
  });
};

/**
 * Hook that wraps vincentApiClient hooks and handles SIWE authentication for registry changes
 */
export function useVincentApiWithSIWE() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const currentSIWEToken = useRef<string | null>(null);
  const authenticationPromise = useRef<Promise<boolean> | null>(null);

  /**
   * Check and set up SIWE token on component mount or address change
   */
  useEffect(() => {
    const clearInvalidSIWE = (): void => {
      localStorage.removeItem(SIWE_STORAGE_KEY);
      currentSIWEToken.current = null;
    };

    const initializeSIWE = async () => {
      if (!isConnected || !address) {
        currentSIWEToken.current = null;
        return;
      }

      const storedSIWE = localStorage.getItem(SIWE_STORAGE_KEY);
      if (storedSIWE) {
        try {
          const siweData: SIWEData = JSON.parse(storedSIWE);
          if (await validateSIWEData(siweData, address)) {
            currentSIWEToken.current = siweData.signature;
          } else {
            clearInvalidSIWE();
          }
        } catch (error) {
          clearInvalidSIWE();
        }
      }
    };

    initializeSIWE();
  }, [address, isConnected]);

  /**
   * Manually trigger SIWE authentication with race condition protection
   */
  const authenticateWithSIWE = useCallback(async (): Promise<boolean> => {
    // If already authenticating, return the existing promise
    if (authenticationPromise.current) {
      return authenticationPromise.current;
    }

    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    // Create a new authentication promise
    authenticationPromise.current = (async () => {
      setIsAuthenticating(true);

      try {
        const siweMessage = generateSIWEMessage(address);
        const message = siweMessage.prepareMessage();
        const signature = await signMessageAsync({ message });

        const newSIWEData: SIWEData = {
          message,
          signature,
          address,
        };

        localStorage.setItem(SIWE_STORAGE_KEY, JSON.stringify(newSIWEData));
        currentSIWEToken.current = signature;
        return true;
      } catch (error) {
        throw new Error('SIWE authentication failed');
      } finally {
        setIsAuthenticating(false);
      }
    })();

    try {
      return await authenticationPromise.current;
    } finally {
      // Clear the promise after completion
      authenticationPromise.current = null;
    }
  }, [address, isConnected, signMessageAsync]);

  /**
   * Check if SIWE authentication is available
   */
  const hasSIWEAuthentication = useCallback(() => {
    return currentSIWEToken.current !== null;
  }, []);

  // Create a wrapper for query hooks without authentication (GET requests)
  const createQueryWrapper = useCallback(<T extends (...args: any[]) => any>(originalHook: T) => {
    return (args: Parameters<T>[0], options?: Parameters<T>[1]) => {
      // No authentication needed for GET requests
      return originalHook(args, options);
    };
  }, []);

  // Create a wrapper for mutation hooks that checks SIWE authentication (POST/PUT/DELETE)
  const createMutationWrapper = useCallback(
    <T extends () => readonly [any, any]>(originalHook: T, method: string) => {
      return () => {
        const [originalMutation, mutationResult] = originalHook();

        const wrappedMutation = async (args: any) => {
          if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
            if (!isConnected || !address) {
              throw new Error('Wallet not connected');
            }
            if (!currentSIWEToken.current) {
              await authenticateWithSIWE();
            }
          }

          return originalMutation(args);
        };

        return [wrappedMutation, mutationResult] as const;
      };
    },
    [isConnected, address, authenticateWithSIWE],
  );

  return {
    authenticateWithSIWE,
    hasSIWEAuthentication,
    isAuthenticating,

    // Lazy query hooks (GET requests - no authentication needed)
    useLazyListAppsQuery: createQueryWrapper(vincentApiClient.useLazyListAppsQuery),
    useLazyGetAppQuery: createQueryWrapper(vincentApiClient.useLazyGetAppQuery),
    useLazyGetAppVersionsQuery: createQueryWrapper(vincentApiClient.useLazyGetAppVersionsQuery),
    useLazyGetAppVersionQuery: createQueryWrapper(vincentApiClient.useLazyGetAppVersionQuery),
    useLazyListAllToolsQuery: createQueryWrapper(vincentApiClient.useLazyListAllToolsQuery),
    useLazyGetToolQuery: createQueryWrapper(vincentApiClient.useLazyGetToolQuery),
    useLazyGetToolVersionsQuery: createQueryWrapper(vincentApiClient.useLazyGetToolVersionsQuery),
    useLazyGetToolVersionQuery: createQueryWrapper(vincentApiClient.useLazyGetToolVersionQuery),
    useLazyListAllPoliciesQuery: createQueryWrapper(vincentApiClient.useLazyListAllPoliciesQuery),
    useLazyGetPolicyQuery: createQueryWrapper(vincentApiClient.useLazyGetPolicyQuery),
    useLazyGetPolicyVersionsQuery: createQueryWrapper(
      vincentApiClient.useLazyGetPolicyVersionsQuery,
    ),
    useLazyGetPolicyVersionQuery: createQueryWrapper(vincentApiClient.useLazyGetPolicyVersionQuery),

    // Mutation hooks (POST/PUT/DELETE requests - SIWE authentication required)
    useCreateAppMutation: createMutationWrapper(vincentApiClient.useCreateAppMutation, 'POST'),
    useEditAppMutation: createMutationWrapper(vincentApiClient.useEditAppMutation, 'PUT'),
    useDeleteAppMutation: createMutationWrapper(vincentApiClient.useDeleteAppMutation, 'DELETE'),
    useCreateAppVersionMutation: createMutationWrapper(
      vincentApiClient.useCreateAppVersionMutation,
      'POST',
    ),
    useEditAppVersionMutation: createMutationWrapper(
      vincentApiClient.useEditAppVersionMutation,
      'PUT',
    ),
    useEnableAppVersionMutation: createMutationWrapper(
      vincentApiClient.useEnableAppVersionMutation,
      'POST',
    ),
    useDisableAppVersionMutation: createMutationWrapper(
      vincentApiClient.useDisableAppVersionMutation,
      'POST',
    ),
    useCreateAppVersionToolMutation: createMutationWrapper(
      vincentApiClient.useCreateAppVersionToolMutation,
      'POST',
    ),
    useEditAppVersionToolMutation: createMutationWrapper(
      vincentApiClient.useEditAppVersionToolMutation,
      'PUT',
    ),
    useCreateToolMutation: createMutationWrapper(vincentApiClient.useCreateToolMutation, 'POST'),
    useEditToolMutation: createMutationWrapper(vincentApiClient.useEditToolMutation, 'PUT'),
    useChangeToolOwnerMutation: createMutationWrapper(
      vincentApiClient.useChangeToolOwnerMutation,
      'PUT',
    ),
    useCreateToolVersionMutation: createMutationWrapper(
      vincentApiClient.useCreateToolVersionMutation,
      'POST',
    ),
    useEditToolVersionMutation: createMutationWrapper(
      vincentApiClient.useEditToolVersionMutation,
      'PUT',
    ),
    useCreatePolicyMutation: createMutationWrapper(
      vincentApiClient.useCreatePolicyMutation,
      'POST',
    ),
    useEditPolicyMutation: createMutationWrapper(vincentApiClient.useEditPolicyMutation, 'PUT'),
    useCreatePolicyVersionMutation: createMutationWrapper(
      vincentApiClient.useCreatePolicyVersionMutation,
      'POST',
    ),
    useEditPolicyVersionMutation: createMutationWrapper(
      vincentApiClient.useEditPolicyVersionMutation,
      'PUT',
    ),
    useChangePolicyOwnerMutation: createMutationWrapper(
      vincentApiClient.useChangePolicyOwnerMutation,
      'PUT',
    ),
  };
}
