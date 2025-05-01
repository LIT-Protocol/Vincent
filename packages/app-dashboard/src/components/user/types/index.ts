import { SessionSigs, IRelayPKP } from '@lit-protocol/types';

// BigNumberHex type for contract results
export type BigNumberHex = {
  type: string;
  hex: string;
};

export interface AppCardProps {
  app: AppDetails;
  onClick: (appId: string) => void;
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
  version: number;
  isDeleted: boolean;
  showInfo?: boolean;
  infoMessage?: string;
}
