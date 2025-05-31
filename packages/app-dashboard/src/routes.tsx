import { Outlet, RouteObject } from 'react-router-dom';
import AppLayout from './layout/app-dashboard/AppLayout';
import UserLayout from './layout/user-dashboard/UserLayout';
import { AppProviders, UserProviders } from './providers';

import * as AppPages from './pages/app-dashboard';
import * as UserPages from './pages/user-dashboard';

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
      path: '/mock-api-forms',
      element: <AppPages.MockApiForms />,
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

const userRoutes = {
  element: (
    <>
      {UserProviders.reduceRight(
        (children, Provider) => (
          <Provider>{children}</Provider>
        ),
        <UserLayout>
          <Outlet />
        </UserLayout>,
      )}
    </>
  ),
  children: [
    {
      path: '/user/wallet',
      element: <UserPages.Withdraw />,
    },
    {
      path: '/appId/:appId/consent',
      element: <UserPages.Consent />,
    },
    {
      path: '/user',
      element: <UserPages.Dashboard />,
    },
    {
      path: '/user/apps',
      element: <UserPages.Apps />,
    },
    {
      path: '/user/appId/:appId',
      element: <UserPages.AppDetails />,
    },
  ],
};

const routes: RouteObject[] = [appRoutes, userRoutes];

export default routes;
