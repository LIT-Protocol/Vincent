// This config is used to drive generation of our complete typedoc site, including our 'documents' md files
// and the typedocs for each SDK/package in the repo.

// By composing JSON entrypoints inside the sub-packages, we can control when changes to the package docs
// are pushed to the live site.  We _usually_ only re-generate those JSON files when publishing to NPM.

// Unfortunately, you can't use watch mode on JSON entrypoints in the root of the repo, so each
// package has its own watch w/ HTML output that is .gitignored for local development iteration

module.exports = {
  extends: './typedoc.config.base.js',
  $schema: 'https://typedoc.org/schema.json',
  readme: './docs/src/Why-Vincent.md',
  projectDocuments: [
    'docs/src/Concepts.md',
    'docs/src/Developers/Getting-Started.md',
    'docs/src/Developers/App-Agent-Developers/Getting-Started.md',
    'docs/src/Developers/Tool-Developers/Getting-Started.md',
    'docs/src/Developers/Policy-Developers/Getting-Started.md',
    'docs/src/Developers/App-Agent-Developers/Creating-Apps.md',
    'docs/src/Developers/App-Agent-Developers/Upgrading-Apps.md',
    'docs/src/Developers/App-Agent-Developers/Auth-Users.md',
    'docs/src/Developers/App-Agent-Developers/Executing-Tools.md',
    'docs/src/Developers/App-Agent-Developers/MCP.md',
    'docs/src/Developers/Tool-Developers/Creating-Tools.md',
    'docs/src/Developers/Tool-Developers/AI-Tool-Development.md',
    'docs/src/Developers/Policy-Developers/Creating-Policies.md',
    'docs/src/Users/Onboarding.md',
    'docs/src/Contact-Us.md',
  ],
  categoryOrder: ['Developers', 'Users', 'Contact', 'Packages'],
  entryPointStrategy: 'merge',
  entryPoints: ['./packages/libs/app-sdk/docs/json', './packages/libs/tool-sdk/docs/json'],
  name: 'Vincent Docs',
  out: './docs/dist/site',
  includeVersion: false,
  navigation: {
    includeCategories: true,
  },
  headings: {
    readme: false,
    // document: false,
  },
  defaultCategory: 'API Docs',
  tsconfig: './tsconfig.base.json',
  categorizeByGroup: false,
  visibilityFilters: {},
  searchInDocuments: true,
};
