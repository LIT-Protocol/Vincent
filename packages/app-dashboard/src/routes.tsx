import { Outlet, RouteObject } from 'react-router-dom';
import AppLayout from './layout/app-dashboard/AppLayout';
import UserLayout from './layout/user-dashboard/UserLayout';
import { AppProviders, UserProviders } from './providers';

import * as UserPages from './pages/user-dashboard';
import { AppDetail } from './pages/app-dashboard/app-detail';
import { AppDetailLayout } from './layout/app-dashboard/AppDetailLayout';
import { AppDashboard } from './pages/app-dashboard';
import { DashboardLayout } from './layout/app-dashboard/DashboardLayout';

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
    // Main dashboard routes with shared layout
    {
      path: '/*',
      element: (
        <DashboardLayout>
          <Outlet />
        </DashboardLayout>
      ),
      children: [
        {
          index: true,
          element: <AppDashboard.Home />,
        },
        {
          path: 'apps',
          element: <AppDashboard.Apps />,
        },
        {
          path: 'tools',
          element: <AppDashboard.Tools />,
        },
        {
          path: 'policies',
          element: <AppDashboard.Policies />,
        },
        {
          path: 'create-app',
          element: <AppDashboard.CreateApp />,
        },
        {
          path: 'create-tool',
          element: <AppDashboard.CreateTool />,
        },
        {
          path: 'create-policy',
          element: <AppDashboard.CreatePolicy />,
        },
      ],
    },
    {
      path: '/appId/:appId/*',
      element: (
        <AppDetailLayout>
          <Outlet />
        </AppDetailLayout>
      ),
      children: [
        {
          index: true,
          element: <AppDetail.Overview />,
        },
        {
          path: 'versions',
          element: <AppDetail.Versions />,
        },
        {
          path: 'version/:versionId',
          element: <AppDetail.Version />,
        },
        {
          path: 'version/:versionId/edit',
          element: <AppDetail.Version />,
        },
        {
          path: 'edit-app',
          element: <AppDetail.Edit />,
        },
        {
          path: 'delete-app',
          element: <AppDetail.Delete />,
        },
        {
          path: 'create-app-version',
          element: <AppDetail.CreateVersion />,
        },
      ],
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
      path: '/user/explorer/appId/:appId',
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
