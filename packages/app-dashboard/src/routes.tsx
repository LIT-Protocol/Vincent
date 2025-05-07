import { Outlet, RouteObject } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { AppProviders } from './providers';

import * as AppPages from './pages/index';

const appRoutes = {
  element: (
    <>
      {AppProviders.reduceRight(
        (children, Provider) => (
          <Provider>{children}</Provider>
        ),
        <AppLayout>
          <Outlet />
        </AppLayout>,
      )}
    </>
  ),
  children: [
    {
      path: '/',
      element: <AppPages.Dashboard />,
    },
    {
      path: '/create-app',
      element: <AppPages.CreateApp />,
    },
    {
      path: '/appId/:appId',
      element: <AppPages.AppDetails />,
    },
    {
      path: '/appId/:appId/advanced-functions',
      element: <AppPages.AdvancedFunctions />,
    },
    {
      path: '/appId/:appId/delegatee',
      element: <AppPages.Delegatee />,
    },
    {
      path: '/appId/:appId/tool-policies',
      element: <AppPages.ToolPolicies />,
    },
  ],
};

const routes: RouteObject[] = [appRoutes];

export default routes;
