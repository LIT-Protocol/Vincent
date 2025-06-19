// This generates just JSON output for all of our root `.md` documents that are not package-specific. The JSON output is composed
// into the complete typedoc site.

module.exports = {
  $schema: 'https://typedoc.org/schema.json',
  extends: '../typedoc.config.base.js',
  readme: 'src/Why-Vincent.md',
  name: 'Vincent Docs',
  projectDocuments: [
    'src/Why-Vincent.md',
    'src/Concepts.md',
    'src/Developers/Getting-Started.md',
    'src/Developers/App-Agent-Developers/Getting-Started.md',
    'src/Developers/Tool-Developers/Getting-Started.md',
    'src/Developers/Policy-Developers/Getting-Started.md',
    'src/Developers/App-Agent-Developers/Creating-Apps.md',
    'src/Developers/App-Agent-Developers/Upgrading-Apps.md',
    'src/Developers/App-Agent-Developers/Auth-Users.md',
    'src/Developers/App-Agent-Developers/Executing-Tools.md',
    'src/Developers/App-Agent-Developers/MCP.md',
    'src/Developers/Tool-Developers/Creating-Tools.md',
    'src/Developers/Policy-Developers/Creating-Policies.md',
    'src/Users/Onboarding.md',
    'src/Contact-Us.md',
  ],
  outputs: [
    {
      name: 'json',
      path: './dist/json',
    },
  ],
  tsconfig: '../tsconfig.json',
  customTitle: 'Vincent Docs',
  includeVersion: false,
  navigation: {
    includeCategories: true,
  },
  defaultCategory: 'API',
  categorizeByGroup: false,
  categoryOrder: ['Intro', 'Developers', 'Users', 'Contact'],
  visibilityFilters: {},
};
