import { IAppVersionDef, IAppToolDef } from './types';

export default async function getVersion(appId: number, versionNumber: number) {
  const dummyVersion: IAppVersionDef = {
    appId: 1,
    versionNumber: 2,
    identity: 'AppVersionDef|1@2',
    enabled: true,
    changes: 'Application Created at 1715222222222',
  };

  const dummyTool1: IAppToolDef = {
    appId: 1,
    appVersionNumber: 2,
    toolPackageName: 'app-dashboard-tool-1',
    toolVersion: '1.0.0',
    appVersionIdentity: 'AppVersionDef|1@2',
    toolIdentity: 'app-dashboard-tool-1@1.0.0',
    identity: 'AppToolDef|1@2/app-dashboard-tool-1@1.0.0',
    hiddenSupportedPolicies: ['policy1', 'policy2'],
  };

  const dummyTool2: IAppToolDef = {
    appId: 1,
    appVersionNumber: 2,
    toolPackageName: 'app-dashboard-tool-2',
    toolVersion: '1.0.0',
    appVersionIdentity: 'AppVersionDef|1@2',
    toolIdentity: 'app-dashboard-tool-2@1.0.0',
    identity: 'AppToolDef|1@2/app-dashboard-tool-2@1.0.0',
    hiddenSupportedPolicies: ['policy1', 'policy2'],
  };

  return {
    version: dummyVersion,
    tools: [dummyTool1, dummyTool2],
  };
}
