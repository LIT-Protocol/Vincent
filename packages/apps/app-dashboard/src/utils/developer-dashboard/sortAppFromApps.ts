import { App } from '@/types/developer-dashboard/appTypes';

export const sortAppFromApps = (apps: App[] | undefined, appId: string | undefined) => {
  if (!appId || !apps) return null;
  return apps.find((app) => app.appId === Number(appId)) || null;
};
