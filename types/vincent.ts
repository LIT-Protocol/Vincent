export interface VincentApp {
  id: string;
  appName: string;
  description: string;
  status: "enabled" | "disabled";
  appManager: string; // Ethereum address
  managerDelegatees: string[]; // Array of Ethereum addresses
  appId: number; // uint256 from AppRegistry contract
  allowedTools: string[]; // List of tool IDs/addresses
  // Off-chain data
  logo?: string;
  supportEmail?: string;
  discordLink?: string;
  githubLink?: string;
  websiteUrl?: string;
} 