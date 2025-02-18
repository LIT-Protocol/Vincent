export interface VincentApp {
  appManager: string; // Ethereum address
  appId: number; // uint256 from AppRegistry contract
  managerDelegatees: string[]; // Array of Ethereum addresses
  allowedTools: string[]; // List of tool IDs/addresses
  // Off-chain data
  id: string;
  appName: string;
  description: string;
  status: "enabled" | "disabled";
  logo?: string;
  supportEmail?: string;
  discordLink?: string;
  githubLink?: string;
  websiteUrl?: string;
} 