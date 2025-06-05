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
      path: '/apps',
      element: <AppPages.Dashboard />,
    },
    {
      path: '/tools',
      element: <AppPages.Dashboard />,
    },
    {
      path: '/policies',
      element: <AppPages.Dashboard />,
    },
    {
      path: '/create-app',
      element: <AppPages.Dashboard />,
    },
    {
      path: '/create-tool',
      element: <AppPages.Dashboard />,
    },
    {
      path: '/create-policy',
      element: <AppPages.Dashboard />,
    },
    {
      path: '/mock-api-forms/appId/:appId',
      element: <AppPages.MockApiForms />,
    },
    {
      path: '/appId/:appId/*',
      element: <AppPages.Dashboard />,
    },
    {
      path: '/appId/:appId/edit',
      element: <AppPages.Dashboard />,
    },
    {
      path: '/appId/:appId/create-version',
      element: <AppPages.Dashboard />,
    },
    {
      path: '/appId/:appId/delete',
      element: <AppPages.Dashboard />,
    },
    {
      path: '/appId/:appId/version/:versionId/edit',
      element: <AppPages.Dashboard />,
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
