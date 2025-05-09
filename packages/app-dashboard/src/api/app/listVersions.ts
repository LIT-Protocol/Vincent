import { IAppVersionDef } from './types';

export default async function listAppVersions(appId: number) {
  const dummyV1: IAppVersionDef = {
    appId: 1,
    versionNumber: 1,
    identity: 'AppVersionDef|1@1',
    enabled: true,
    changes: 'Application Created at 1715222222222',
    // NOTE: Intentionally not tracking Tools; reverse indexing for flexibility
  };

  const dummyV2: IAppVersionDef = {
    appId: 1,
    versionNumber: 2,
    identity: 'AppVersionDef|1@2',
    enabled: true,
    changes: 'Application Created at 1715222222222',
  };

  return [dummyV1, dummyV2];
}
