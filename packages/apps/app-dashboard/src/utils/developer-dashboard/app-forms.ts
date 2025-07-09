import { useNavigate } from 'react-router-dom';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';

/** Delay in milliseconds for redirects after successful operations */
export const REDIRECT_DELAY_MS = 1500;

/**
 * Handles navigation with a delay after successful operations
 */
export const navigateWithDelay = (navigate: ReturnType<typeof useNavigate>, path: string) => {
  setTimeout(() => navigate(path), REDIRECT_DELAY_MS);
};

/**
 * Extracts error message from RTK Query error objects
 */
export const getErrorMessage = (
  error: FetchBaseQueryError | SerializedError | undefined,
  fallbackMessage: string,
): string => {
  if (!error) return fallbackMessage;

  if ('status' in error) {
    // FetchBaseQueryError
    return (error.data as { message?: string })?.message || fallbackMessage;
  }

  if ('message' in error) {
    // SerializedError
    return error.message || fallbackMessage;
  }

  return fallbackMessage;
};
