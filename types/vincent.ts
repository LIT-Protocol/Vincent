export interface VincentApp {
  // On-chain data
  enabled: boolean;
  roleIds: number[];
  managerDelegatees: string[];
  appCreator: string;

  // For Each Role Id
  roleVersion: string;
  toolPolicy: ToolPolicy[];

  // Off-chain data
  appId: string;
  appName: string;
  description: string;
  logo?: string;
  email?: string;
  domain?: string;
} 

export interface ToolPolicy {
  toolCId: string;
  policyCId: string;
}
