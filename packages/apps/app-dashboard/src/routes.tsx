import { Outlet, RouteObject } from 'react-router';
import AppLayout from '@/layout/developer-dashboard/AppLayout';
import UserDashboardLayout from '@/layout/user-dashboard/UserDashboardLayout';
import UserLayoutWithSidebar from '@/layout/user-dashboard/UserLayoutWithSidebar';
import { AppProviders, UserProviders } from './providers';
import { wrap } from '@/utils/shared/components';

import { Dashboard } from './pages/developer-dashboard';
import RootPage from './pages/shared/RootPage';

import {
  AppsWrapper,
  AppOverviewWrapper,
  AppVersionDetailWrapper,
  AppVersionsWrapper,
  AppVersionAbilitiesWrapper,
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
  AbilitiesWrapper,
  AbilityOverviewWrapper,
  CreateAbilityWrapper,
  EditAbilityWrapper,
  CreateAbilityVersionWrapper,
  ChangeAbilityOwnerWrapper,
  AbilityVersionsWrapper,
  AbilityVersionDetailsWrapper,
  EditAbilityVersionWrapper,
  DeleteAbilityWrapper,
  DeleteAbilityVersionWrapper,
} from '@/components/developer-dashboard/ability/wrappers';

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

import { AppExploreWrapper } from './components/explorer/wrappers/AppExploreWrapper';
import { AppInfoWrapper } from './components/explorer/wrappers/AppInfoWrapper';
import { ExplorerLandingPage } from './pages/explorer/ExplorerLandingPage';

import { Wallet } from './pages/user-dashboard/wallet';
import { UserPermissionWrapper } from './components/user-dashboard/dashboard/UserPermissionWrapper';
import { ConnectPageWrapper } from './components/user-dashboard/connect/ConnectPageWraper';
import { PermittedAppsWrapper } from './components/user-dashboard/dashboard/PermittedAppsWrapper';
import { UpdateVersionPageWrapper } from './components/user-dashboard/dashboard/UpdateVersionPageWrapper';

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
    path: '/',
    element: <RootPage />,
  },
  {
    element: <AppLayoutWithProviders />,
    children: [
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
            path: 'appId/:appId/version/:versionId/abilities',
            element: <AppVersionAbilitiesWrapper />,
          },
          {
            path: 'appId/:appId/version/:versionId/delete-version',
            element: <DeleteAppVersionWrapper />,
          },
          {
            path: 'abilities',
            element: <AbilitiesWrapper />,
          },
          {
            path: 'create-ability',
            element: <CreateAbilityWrapper />,
          },
          {
            path: 'ability/:packageName',
            element: <AbilityOverviewWrapper />,
          },
          {
            path: 'ability/:packageName/edit-ability',
            element: <EditAbilityWrapper />,
          },
          {
            path: 'ability/:packageName/create-ability-version',
            element: <CreateAbilityVersionWrapper />,
          },
          {
            path: 'ability/:packageName/change-ability-owner',
            element: <ChangeAbilityOwnerWrapper />,
          },
          {
            path: 'ability/:packageName/versions',
            element: <AbilityVersionsWrapper />,
          },
          {
            path: 'ability/:packageName/version/:version',
            element: <AbilityVersionDetailsWrapper />,
          },
          {
            path: 'ability/:packageName/version/:version/edit-version',
            element: <EditAbilityVersionWrapper />,
          },
          {
            path: 'ability/:packageName/delete-ability',
            element: <DeleteAbilityWrapper />,
          },
          {
            path: 'ability/:packageName/version/:version/delete-version',
            element: <DeleteAbilityVersionWrapper />,
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
            path: 'policy/:packageName',
            element: <PolicyOverviewWrapper />,
          },
          {
            path: 'policy/:packageName/edit-policy',
            element: <EditPolicyWrapper />,
          },
          {
            path: 'policy/:packageName/create-policy-version',
            element: <CreatePolicyVersionWrapper />,
          },
          {
            path: 'policy/:packageName/change-policy-owner',
            element: <ChangePolicyOwnerWrapper />,
          },
          {
            path: 'policy/:packageName/versions',
            element: <PolicyVersionsWrapper />,
          },
          {
            path: 'policy/:packageName/version/:version',
            element: <PolicyVersionDetailsWrapper />,
          },
          {
            path: 'policy/:packageName/version/:version/edit-version',
            element: <EditPolicyVersionWrapper />,
          },
          {
            path: 'policy/:packageName/delete-policy',
            element: <DeletePolicyWrapper />,
          },
          {
            path: 'policy/:packageName/version/:version/delete-version',
            element: <DeletePolicyVersionWrapper />,
          },
        ],
      },
    ],
  },
  {
    path: '/explorer',
    element: <ExplorerLandingPage />,
  },
  {
    element: <UserDashboardLayoutWithProviders />,
    children: [
      {
        path: '/user/appId/:appId/connect',
        element: <ConnectPageWrapper />,
      },
      {
        path: '/explorer/apps',
        element: <AppExploreWrapper />,
      },
      {
        path: '/explorer/appId/:appId',
        element: <AppInfoWrapper />,
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
            path: 'appId/:appId',
            element: <UserPermissionWrapper />,
          },
          {
            path: 'appId/:appId/update-version',
            element: <UpdateVersionPageWrapper />,
          },
          {
            path: 'apps',
            element: <PermittedAppsWrapper />,
          },
          {
            path: 'appId/:appId/wallet',
            element: <Wallet />,
          },
        ],
      },
    ],
  },
];

export default routes;
