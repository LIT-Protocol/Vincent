import { IAppDef } from './types';

export default async function getApp(appId: number): Promise<IAppDef> {
  const sampleApp: IAppDef = {
    appId: appId,
    identity: 1,
    activeVersion: 1,
    name: 'Sample App',
    description: 'This is a sample app',
    contactEmail: 'test@test.com',
    appUserUrl: 'https://app.test.com',
    logo: 'https://i.imgur.com/k1i4vKw.png',
    redirectUrls: ['https://app.test.com/redirect'],
    deploymentStatus: 'dev',
    managerAddress: '0x1234567890123456789012345678901234567890',
    lastUpdated: new Date(),
  };
  return sampleApp;
}
