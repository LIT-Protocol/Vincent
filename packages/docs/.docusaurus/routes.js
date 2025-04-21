import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '9d0'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '46a'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '87c'),
            routes: [
              {
                path: '/api/',
                component: ComponentCreator('/api/', '1c0'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/api/reference/',
                component: ComponentCreator('/api/reference/', 'f25'),
                exact: true
              },
              {
                path: '/api/reference/@lit-protocol/namespaces/expressAuthHelpers/',
                component: ComponentCreator('/api/reference/@lit-protocol/namespaces/expressAuthHelpers/', 'fbc'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/api/reference/@lit-protocol/namespaces/expressAuthHelpers/functions/authenticatedRequestHandler',
                component: ComponentCreator('/api/reference/@lit-protocol/namespaces/expressAuthHelpers/functions/authenticatedRequestHandler', 'c9a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/api/reference/@lit-protocol/namespaces/expressAuthHelpers/functions/getAuthenticateUserExpressHandler',
                component: ComponentCreator('/api/reference/@lit-protocol/namespaces/expressAuthHelpers/functions/getAuthenticateUserExpressHandler', '395'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/api/reference/@lit-protocol/namespaces/jwt/',
                component: ComponentCreator('/api/reference/@lit-protocol/namespaces/jwt/', '4ec'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/api/reference/@lit-protocol/namespaces/jwt/functions/decode',
                component: ComponentCreator('/api/reference/@lit-protocol/namespaces/jwt/functions/decode', '189'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/api/reference/@lit-protocol/namespaces/jwt/functions/isExpired',
                component: ComponentCreator('/api/reference/@lit-protocol/namespaces/jwt/functions/isExpired', '1f5'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/api/reference/@lit-protocol/namespaces/jwt/functions/verify',
                component: ComponentCreator('/api/reference/@lit-protocol/namespaces/jwt/functions/verify', 'b03'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/api/reference/functions/getVincentToolClient',
                component: ComponentCreator('/api/reference/functions/getVincentToolClient', '927'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/api/reference/functions/getVincentWebAppClient',
                component: ComponentCreator('/api/reference/functions/getVincentWebAppClient', '6a9'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/api/reference/interfaces/ExpressAuthHelpers',
                component: ComponentCreator('/api/reference/interfaces/ExpressAuthHelpers', 'e59'),
                exact: true
              },
              {
                path: '/api/reference/interfaces/VincentJWT',
                component: ComponentCreator('/api/reference/interfaces/VincentJWT', '297'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/api/reference/interfaces/VincentJWTPayload',
                component: ComponentCreator('/api/reference/interfaces/VincentJWTPayload', 'b09'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/api/reference/interfaces/VincentToolClient',
                component: ComponentCreator('/api/reference/interfaces/VincentToolClient', '785'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/api/reference/interfaces/VincentWebAppClient',
                component: ComponentCreator('/api/reference/interfaces/VincentWebAppClient', 'b3a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Contact-Us',
                component: ComponentCreator('/Contact-Us', 'd05'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Developers/Custom-Tools',
                component: ComponentCreator('/Developers/Custom-Tools', 'a12'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Developers/Quick-Start',
                component: ComponentCreator('/Developers/Quick-Start', '651'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Users/Onboarding',
                component: ComponentCreator('/Users/Onboarding', '855'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/',
                component: ComponentCreator('/', 'b6b'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
