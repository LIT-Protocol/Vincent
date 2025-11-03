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

/**
 * Extracts error message from unknown caught errors (for use in catch blocks)
 * Handles RTK Query errors, Error objects, and other error types
 */
export const extractErrorMessage = (error: unknown, fallbackMessage: string): string => {
  // RTK Query error with nested data.message
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data;

    // Check for data.message
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message: unknown }).message;
      if (typeof message === 'string' && message) {
        return message;
      }
    }

    // Check for data.error
    if (data && typeof data === 'object' && 'error' in data) {
      const errorStr = (data as { error: unknown }).error;
      if (typeof errorStr === 'string' && errorStr) {
        return errorStr;
      }
    }

    // If data is a string itself
    if (typeof data === 'string' && data) {
      return data;
    }
  }

  // Standard Error object
  if (error instanceof Error && error.message) {
    return error.message;
  }

  // Object with message property
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string' && message) {
      return message;
    }
  }

  // Object with error property
  if (error && typeof error === 'object' && 'error' in error) {
    const errorStr = (error as { error: unknown }).error;
    if (typeof errorStr === 'string' && errorStr) {
      return errorStr;
    }
  }

  return fallbackMessage;
};
