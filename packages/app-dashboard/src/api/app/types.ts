export interface IAppDef {
  appId: number; // Generated on-chain, used to link all app-related data
  identity: number; // AppDef|<appId>
  activeVersion: number; // Allows for rolling back to prior app deployments
  name: string; // Users will see this app name in the registry
  description: string; // Users will see this description -- Support Markdown
  contactEmail: string; // Contact email for users (or LIT?) to reach app owner
  appUserUrl: string; // Definitive URL for users to use to access the app
  logo?: string; // Base64 of logo users see for the app - ENFORCE FORMAT GIF|JPG
  redirectUrls: string[]; // Allowed redirect target w/ JWT auth
  deploymentStatus: string; // dev | prod | test
  managerAddress: string; // wallet address allowed to manage on-chain data
  lastUpdated: Date; // Last time app definition was edited by its owner
}
