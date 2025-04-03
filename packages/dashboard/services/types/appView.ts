/**
 * Interface for the App data structure used in the dashboard
 */
export interface AppView {
  appId: number;
  appName: string;
  description: string;
  authorizedRedirectUris: string[];
  delegatees: string[];
  toolPolicies: any[]; // Array of version data
  managementWallet: string;
  currentVersion: number;
  deploymentStatus?: number; // 0: DEV, 1: TEST, 2: PROD
  isDeleted?: boolean;
} 