import { IAppVersionDef, IAppToolDef } from './types';
import listAppVersions from './listVersions';

interface ToolInput {
  toolIpfsCid: string;
  toolPackageName: string;
  toolVersion: string;
  policies?: Array<{
    policyIpfsCid: string;
    parameters?: Array<{
      name: string;
      type: string;
    }>;
  }>;
}

export default async function createVersion(appId: number, changes?: string, tools?: ToolInput[]) {
  try {
    // 1. Find the latest version number and increment by 1
    const existingVersions = await listAppVersions(appId);
    const latestVersion = existingVersions.reduce(
      (max, version) => Math.max(max, version.versionNumber),
      0,
    );
    const newVersionNumber = latestVersion + 1;

    // 2. Create a new AppVersionDef
    const newVersion: IAppVersionDef = {
      appId,
      versionNumber: newVersionNumber,
      identity: `AppVersionDef|${appId}@${newVersionNumber}`,
      enabled: true,
      changes: changes || `Application Created at ${Date.now()}`,
    };

    // 3. Create AppToolDefs for each selected tool
    const appToolDefs = (tools || []).map((tool) => {
      const toolPackageName = tool.toolPackageName || `tool-${Math.floor(Math.random() * 1000)}`;
      const toolVersion = tool.toolVersion || '1.0.0';

      // Create the IAppToolDef with only the properties in the interface
      const appToolDef: IAppToolDef = {
        appId,
        appVersionNumber: newVersionNumber,
        toolPackageName,
        toolVersion,
        appVersionIdentity: `AppVersionDef|${appId}@${newVersionNumber}`,
        toolIdentity: `${toolPackageName}@${toolVersion}`,
        identity: `AppToolDef|${appId}@${newVersionNumber}/${toolPackageName}@${toolVersion}`,
        hiddenSupportedPolicies: [],
      };

      // Return both the IAppToolDef and the extra data
      return {
        ...appToolDef,
        // These are stored separately in the real implementation
        _extraData: {
          toolIpfsCid: tool.toolIpfsCid,
          policies: tool.policies || [],
        },
      };
    });

    // In a real implementation, we would persist this data
    console.log('Creating new version:', newVersion);
    console.log('Creating tools:', appToolDefs);

    return {
      success: true,
      version: newVersion,
      tools: appToolDefs,
      message: `Version ${newVersionNumber} created successfully`,
    };
  } catch (error) {
    console.error('Error creating version:', error);
    return {
      success: false,
      message: `Failed to create version: ${(error as Error).message}`,
    };
  }
}
