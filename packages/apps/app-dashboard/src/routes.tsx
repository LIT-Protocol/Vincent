import { Outlet, RouteObject } from 'react-router';
import AppLayout from '@/layout/developer-dashboard/AppLayout';
import UserDashboardLayout from '@/layout/user-dashboard/UserDashboardLayout';
import UserLayoutWithSidebar from '@/layout/user-dashboard/UserLayoutWithSidebar';
import { AppProviders, UserProviders } from './providers';
import { wrap } from '@/utils/shared/components';

import { ConnectWallet, Dashboard } from './pages/developer-dashboard';

import {
  AppsWrapper,
  AppOverviewWrapper,
  AppVersionDetailWrapper,
  AppVersionsWrapper,
  AppVersionToolsWrapper,
  CreateAppVersionWrapper,
  EditAppVersionWrapper,
  EditAppWrapper,
  EditPublishedAppWrapper,
  DeleteAppWrapper,
  CreateAppWrapper,
  DeleteAppVersionWrapper,
  ManageDelegateesWrapper,
} from './components/developer-dashboard/app/wrappers';

import {
  ToolsWrapper,
  ToolOverviewWrapper,
  CreateToolWrapper,
  EditToolWrapper,
  CreateToolVersionWrapper,
  ChangeToolOwnerWrapper,
  ToolVersionsWrapper,
  ToolVersionDetailsWrapper,
  EditToolVersionWrapper,
  DeleteToolWrapper,
  DeleteToolVersionWrapper,
} from './components/developer-dashboard/tool/wrappers';

import {
  PoliciesWrapper,
  PolicyOverviewWrapper,
  CreatePolicyWrapper,
  EditPolicyWrapper,
  CreatePolicyVersionWrapper,
  ChangePolicyOwnerWrapper,
  PolicyVersionsWrapper,
  PolicyVersionDetailsWrapper,
  EditPolicyVersionWrapper,
  DeletePolicyWrapper,
  DeletePolicyVersionWrapper,
} from './components/developer-dashboard/policy/wrappers';

import { Home, Wallet, Apps, UserDashboard } from './pages/user-dashboard';
import { UserPermissionWrapper } from './components/user-dashboard/dashboard/UserPermissionWrapper';
import { ConsentPageWrapper } from './components/user-dashboard/consent/ConsentPageWraper';

const AppLayoutWithProviders = wrap(() => <Outlet />, [...AppProviders, AppLayout]);
const UserDashboardLayoutWithProviders = wrap(
  () => <Outlet />,
  [...UserProviders, UserDashboardLayout],
);
const UserLayoutWithSidebarAndProviders = wrap(
  () => <Outlet />,
  [...UserProviders, UserLayoutWithSidebar],
);

const routes: RouteObject[] = [
  {
    element: <AppLayoutWithProviders />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/developer',
        element: <ConnectWallet />,
      },
      {
        path: '/developer/*',
        element: <Outlet />,
        children: [
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'apps',
            element: <AppsWrapper />,
          },
          {
            path: 'create-app/*',
            element: <CreateAppWrapper />,
          },
          {
            path: 'appId/:appId/edit-published-app',
            element: <EditPublishedAppWrapper />,
          },
          {
            path: 'appId/:appId',
            element: <AppOverviewWrapper />,
          },
          {
            path: 'appId/:appId/edit-app',
            element: <EditAppWrapper />,
          },
          {
            path: 'appId/:appId/manage-delegatees',
            element: <ManageDelegateesWrapper />,
          },
          {
            path: 'appId/:appId/delete-app',
            element: <DeleteAppWrapper />,
          },
          {
            path: 'appId/:appId/versions',
            element: <AppVersionsWrapper />,
          },
          {
            path: 'appId/:appId/create-app-version',
            element: <CreateAppVersionWrapper />,
          },
          {
            path: 'appId/:appId/version/:versionId',
            element: <AppVersionDetailWrapper />,
          },
          {
            path: 'appId/:appId/version/:versionId/edit',
            element: <EditAppVersionWrapper />,
          },
          {
            path: 'appId/:appId/version/:versionId/tools',
            element: <AppVersionToolsWrapper />,
          },
          {
            path: 'appId/:appId/version/:versionId/delete-version',
            element: <DeleteAppVersionWrapper />,
          },
          {
            path: 'tools',
            element: <ToolsWrapper />,
          },
          {
            path: 'create-tool',
            element: <CreateToolWrapper />,
          },
          {
            path: 'toolId/:packageName',
            element: <ToolOverviewWrapper />,
          },
          {
            path: 'toolId/:packageName/edit-tool',
            element: <EditToolWrapper />,
          },
          {
            path: 'toolId/:packageName/create-tool-version',
            element: <CreateToolVersionWrapper />,
          },
          {
            path: 'toolId/:packageName/change-tool-owner',
            element: <ChangeToolOwnerWrapper />,
          },
          {
            path: 'toolId/:packageName/versions',
            element: <ToolVersionsWrapper />,
          },
          {
            path: 'toolId/:packageName/version/:version',
            element: <ToolVersionDetailsWrapper />,
          },
          {
            path: 'toolId/:packageName/version/:version/edit-version',
            element: <EditToolVersionWrapper />,
          },
          {
            path: 'toolId/:packageName/delete-tool',
            element: <DeleteToolWrapper />,
          },
          {
            path: 'toolId/:packageName/version/:version/delete-version',
            element: <DeleteToolVersionWrapper />,
          },
          {
            path: 'policies',
            element: <PoliciesWrapper />,
          },
          {
            path: 'create-policy',
            element: <CreatePolicyWrapper />,
          },
          {
            path: 'policyId/:packageName',
            element: <PolicyOverviewWrapper />,
          },
          {
            path: 'policyId/:packageName/edit-policy',
            element: <EditPolicyWrapper />,
          },
          {
            path: 'policyId/:packageName/create-policy-version',
            element: <CreatePolicyVersionWrapper />,
          },
          {
            path: 'policyId/:packageName/change-policy-owner',
            element: <ChangePolicyOwnerWrapper />,
          },
          {
            path: 'policyId/:packageName/versions',
            element: <PolicyVersionsWrapper />,
          },
          {
            path: 'policyId/:packageName/version/:version',
            element: <PolicyVersionDetailsWrapper />,
          },
          {
            path: 'policyId/:packageName/version/:version/edit-version',
            element: <EditPolicyVersionWrapper />,
          },
          {
            path: 'policyId/:packageName/delete-policy',
            element: <DeletePolicyWrapper />,
          },
          {
            path: 'policyId/:packageName/version/:version/delete-version',
            element: <DeletePolicyVersionWrapper />,
          },
        ],
      },
    ],
  },
  {
    element: <UserDashboardLayoutWithProviders />,
    children: [
      {
        path: '/user',
        element: <Home />,
      },
    ],
  },
  {
    element: <UserLayoutWithSidebarAndProviders />,
    children: [
      {
        path: '/user/*',
        element: <Outlet />,
        children: [
          {
            path: 'dashboard',
            element: <UserDashboard />,
          },
          {
            path: 'appId/:appId',
            element: <UserPermissionWrapper />,
          },
          {
            path: 'apps',
            element: <Apps />,
          },
          {
            path: 'wallet',
            element: <Wallet />,
          },
          {
            path: 'consent/appId/:appId',
            element: <ConsentPageWrapper />,
          },
        ],
      },
    ],
  },
];

export default routes;
