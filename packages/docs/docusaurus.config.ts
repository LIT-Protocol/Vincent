import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Vincent',
  tagline: 'AI Agent Wallet Delegation Management',
  favicon: 'img/vincent-favicon.png',
  url: 'https://docs.heyvincent.ai',
  baseUrl: '/',
  organizationName: 'LIT-Protocol',
  projectName: 'vincent',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        entryPoints: ['../../packages/sdk/src/index.ts'],
        tsconfig: '../../packages/sdk/tsconfig.lib.json',
        out: 'docs/api/reference',
        plugin: ['typedoc-plugin-markdown'],
        skipErrorChecking: true,
        hidePageTitle: true,
        hideBreadcrumbs: true,
        readme: 'none',
        disableSources: false,
        gitRevision: 'main',
        sourceLinkTemplate: 'https://github.com/LIT-Protocol/Vincent/blob/main/{path}#L{line}',
        excludePrivate: true,
        excludeProtected: true,
        excludeExternals: false,
        titleTemplate: '%s',
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/LIT-Protocol/vincentDocs',
          routeBasePath: '/',
        },
        theme: {
          customCss: [
            './src/css/custom.css',
            './src/css/dark-mode.css'
          ],
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/lit-logo.svg',
    navbar: {
      logo: {
        alt: 'Vincent Logo',
        src: 'img/vincent-logo-black.png',
      },
      items: [
        {
          to: '/',
          label: 'Docs',
          position: 'left',
        },
        {to: 'https://spark.litprotocol.com/', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/LIT-Protocol/Vincent',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Lit Protocol',
          items: [
            {
              label: 'Learn More',
              href: 'https://www.litprotocol.com/',
            },
            {
              label: 'Developer Docs',
              href: 'https://developer.litprotocol.com/',
            },
            {
              label: 'Blogs',
              href: 'https://spark.litprotocol.com/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Telegram',
              href: 'https://t.me/+aa73FAF9Vp82ZjJh',
            },
            {
              label: 'Discord',
              href: 'https://getlit.dev/chat',
            },
            {
              label: 'X',
              href: 'https://x.com/litprotocol',
            },
          ],
        },
        {
          title: 'Vincent',
          items: [
            {
              label: 'SDK API Docs',
              href: 'https://sdk-docs.heyvincent.ai/',
            },
            {
              label: 'Github',
              href: 'https://github.com/LIT-Protocol/Vincent',
            },
            {
              label: 'Docs Repo',
              href: 'https://github.com/LIT-Protocol/vincentDocs',
            },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} Vincent, By Lit Protocol`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
