import { Outlet, RouteObject } from 'react-router';
import AppLayout from '@/layout/developer-dashboard/AppLayout';
import GlobeLayout from '@/layout/shared/GlobeLayout';
import PublicLayout from '@/layout/shared/PublicLayout';
import { DashboardProviders, PublicProviders } from './providers';
import { wrap } from '@/utils/shared/components';

import DashboardPage from './pages/developer-dashboard/DashboardRoute';
import RootPage from './pages/shared/RootPage';

import {
  AppsWrapper,
  AppOverviewWrapper,
  AppVersionsWrapper,
  AppVersionDetailsWrapper,
  CreateAppWrapper,
  CreateAppVersionWrapper,
} from './components/developer-dashboard/app/wrappers';

import {
  AbilitiesWrapper,
  AbilityOverviewWrapper,
  CreateAbilityWrapper,
  AbilityVersionsWrapper,
  AbilityVersionDetailsWrapper,
} from '@/components/developer-dashboard/ability/wrappers';

import {
  PoliciesWrapper,
  PolicyOverviewWrapper,
  CreatePolicyWrapper,
  PolicyVersionsWrapper,
  PolicyVersionDetailsWrapper,
} from './components/developer-dashboard/policy/wrappers';

import { AppExploreWrapper } from './components/explorer/wrappers/AppExploreWrapper';
import { AppInfoWrapper } from './components/explorer/wrappers/AppInfoWrapper';

const AppLayoutWithProviders = wrap(() => <Outlet />, [...DashboardProviders, AppLayout]);
const PublicLayoutWithProviders = wrap(() => <Outlet />, [...PublicProviders, PublicLayout]);

const routes: RouteObject[] = [
  {
    element: <GlobeLayout />,
    children: [
      {
        path: '/',
        element: <RootPage />,
      },
      {
        element: <PublicLayoutWithProviders />,
        children: [
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
        element: <AppLayoutWithProviders />,
        children: [
          {
            path: '/developer/*',
            element: <Outlet />,
            children: [
              {
                path: 'dashboard',
                element: <DashboardPage />,
              },
              {
                path: 'apps',
                element: <Outlet />,
                children: [
                  {
                    index: true,
                    element: <AppsWrapper />,
                  },
                  {
                    path: 'create-app/*',
                    element: <CreateAppWrapper />,
                  },
                  {
                    path: 'appId/:appId',
                    element: <AppOverviewWrapper />,
                  },
                  {
                    path: 'appId/:appId/versions',
                    element: <AppVersionsWrapper />,
                  },
                  {
                    path: 'appId/:appId/version/:version',
                    element: <AppVersionDetailsWrapper />,
                  },
                  {
                    path: 'appId/:appId/new-version',
                    element: <CreateAppVersionWrapper />,
                  },
                ],
              },
              {
                path: 'abilities',
                element: <Outlet />,
                children: [
                  {
                    index: true,
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
                    path: 'ability/:packageName/versions',
                    element: <AbilityVersionsWrapper />,
                  },
                  {
                    path: 'ability/:packageName/version/:version',
                    element: <AbilityVersionDetailsWrapper />,
                  },
                ],
              },
              {
                path: 'policies',
                element: <Outlet />,
                children: [
                  {
                    index: true,
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
                    path: 'policy/:packageName/versions',
                    element: <PolicyVersionsWrapper />,
                  },
                  {
                    path: 'policy/:packageName/version/:version',
                    element: <PolicyVersionDetailsWrapper />,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export default routes;
