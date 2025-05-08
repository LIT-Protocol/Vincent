import { IAppDef } from './types';

export default async function editApp(app: IAppDef): Promise<IAppDef> {
  const key = `app: ${app.appId}`;
  localStorage.setItem(key, JSON.stringify(app));

  return app;
}
