import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'Why-Vincent',
    {
      type: 'category',
      label: 'Developers',
      link: {
        type: 'doc',
        id: 'Developers/Quick-Start',
      },
      items: [
        'Developers/Quick-Start',
        'Developers/Custom-Tools',
      ],
    },
    {
      type: 'category',
      label: 'Users',
      link: {
        type: 'doc',
        id: 'Users/Onboarding',
      },
      items: [
        'Users/Onboarding',
      ],
    },
    {
      type: 'category',
      label: 'SDK API',
      link: {
        type: 'doc',
        id: 'api/index',
      },
      items: [
        {
          type: 'category',
          label: 'Functions',
          items: [
            'api/reference/functions/getVincentToolClient',
            'api/reference/functions/getVincentWebAppClient',
          ],
        },
        {
          type: 'category',
          label: 'Interfaces',
          items: [
            'api/reference/interfaces/VincentToolClient',
            'api/reference/interfaces/VincentWebAppClient',
            'api/reference/interfaces/VincentJWT',
            'api/reference/interfaces/VincentJWTPayload',
          ],
        },
        {
          type: 'category',
          label: '@lit-protocol',
          items: [
            {
              type: 'category',
              label: 'expressAuthHelpers',
              link: {
                type: 'doc',
                id: 'api/reference/@lit-protocol/namespaces/expressAuthHelpers/index',
              },
              items: [
                'api/reference/@lit-protocol/namespaces/expressAuthHelpers/functions/authenticatedRequestHandler',
                'api/reference/@lit-protocol/namespaces/expressAuthHelpers/functions/getAuthenticateUserExpressHandler',
              ],
            },
            {
              type: 'category',
              label: 'jwt',
              link: {
                type: 'doc',
                id: 'api/reference/@lit-protocol/namespaces/jwt/index',
              },
              items: [
                'api/reference/@lit-protocol/namespaces/jwt/functions/decode',
                'api/reference/@lit-protocol/namespaces/jwt/functions/isExpired',
                'api/reference/@lit-protocol/namespaces/jwt/functions/verify',
              ],
            },
          ],
        },
      ],
    },
    'Contact-Us',
  ],
};

export default sidebars;
