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

export interface IAppVersionDef {
  appId: number; // Numeric, sequentially assigned app ID this App Version is for
  versionNumber: number; // Default to 1 since this is app creation
  identity: string; // AppVersionDef|<appId>@<versionNumber>
  enabled: boolean; // Default to true
  changes: string; // Default to "Application Created at {Date.now()}"?
  // NOTE: Intentionally not tracking Tools; reverse indexing for flexibility
}

export interface IAppToolDef {
  appId: number; // Numeric, sequentially assigned app ID this Tool is for
  appVersionNumber: number; // Default to 1 since this is app creation
  toolPackageName: string; // NPM package name of the Tool
  toolVersion: string; // NPM package explicit semver of the Tool
  appVersionIdentity: string; // <appId>@<appVersionNumber>
  toolIdentity: string; // <toolPackageName>@<toolVersion>
  identity: string; // AppToolDef|<appIdentity>/<toolIdentity>

  // Example app-specific extra metadata for this tool
  hiddenSupportedPolicies: string[]; // Array of policies that the tool supports but the app author doesn't
}
