/**
 * Interface for the app details
 */
export interface AppDetailsState {
  id: string;
  name: string;
  description: string;
  deploymentStatus: number;
  isDeleted: boolean;
  manager: string;
  latestVersion: number;
  permittedVersion: number | null;
  authorizedRedirectUris: string[];
  delegatees?: string[]; // Optional property for AppView compatibility
}

/**
 * Status message types
 */
export type StatusType = 'info' | 'warning' | 'success' | 'error';

/**
 * Function type for showing status messages
 */
export type ShowStatusFn = (message: string, type?: StatusType) => void;

/**
 * Function type for showing error with status
 */
export type ShowErrorWithStatusFn = (
  errorMessage: string,
  title?: string,
  details?: string,
) => void;
