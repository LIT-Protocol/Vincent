import { SessionSigs, IRelayPKP } from '@lit-protocol/types';

// BigNumberHex type for contract results
export type BigNumberHex = {
  type: string;
  hex: string;
};

export interface AppCardProps {
  app: AppDetails;
  onUpgrade: (appId: string) => void;
  onClick: (appId: string) => void;
  isUpgrading: boolean;
  upgradingAppId: string | null;
}

export interface UserAppsViewProps {
  userPKP: IRelayPKP;
  sessionSigs: SessionSigs;
  agentPKP?: IRelayPKP;
}

export interface AppDetails {
  id: string;
  name: string;
  description?: string;
  deploymentStatus: number;
  managementWallet: string;
  version: number;
  isDeleted: boolean;
  latestVersion: number;
  delegatees: string[];
  authorizedRedirectUris: string[];
  showUpgradePrompt?: boolean;
}
