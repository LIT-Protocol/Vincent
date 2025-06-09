import { Outlet, RouteObject } from 'react-router-dom';
import AppLayout from './layout/app-dashboard/AppLayout';
import UserLayout from './layout/user-dashboard/UserLayout';
import { AppProviders, UserProviders } from './providers';

import * as AppPages from './pages/app-dashboard';
import * as UserPages from './pages/user-dashboard';
import { AppDetail } from './pages/app-dashboard/app-details';

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
    // App-specific routes - use proper nested routes
    {
      path: '/appId/:appId',
      element: <AppDetail />,
    },
    {
      path: '/appId/:appId/versions',
      element: <AppDetail />,
    },
    {
      path: '/appId/:appId/version/:versionId',
      element: <AppDetail />,
    },
    {
      path: '/appId/:appId/version/:versionId/edit',
      element: <AppDetail />,
    },
    {
      path: '/appId/:appId/edit-app',
      element: <AppDetail />,
    },
    {
      path: '/appId/:appId/delete-app',
      element: <AppDetail />,
    },
    {
      path: '/appId/:appId/create-app-version',
      element: <AppDetail />,
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
      path: '/user/dashboard',
      element: <UserPages.Dashboard />,
    },
    {
      path: '/user',
      element: <UserPages.Home />,
    },
    {
      path: '/user/apps',
      element: <UserPages.Apps />,
    },
    {
      path: '/user/explorer',
      element: <UserPages.Explorer />,
    },
    {
      path: '/user/appId/:appId',
      element: <UserPages.AppDetails />,
    },
  ],
};

const routes: RouteObject[] = [appRoutes, userRoutes];

export default routes;
