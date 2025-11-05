import fs from 'fs';
import path from 'path';

const docsJsonPath = 'docs/docs.json';
const apiRefBasePath = 'docs/api-reference';

const docsJson = JSON.parse(fs.readFileSync(docsJsonPath, 'utf-8'));
let apiRefTab = docsJson.navigation.tabs.find(tab => tab.tab === 'API Reference');

if (!apiRefTab) {
  apiRefTab = {
    tab: 'API Reference',
    groups: []
  };
  docsJson.navigation.tabs.push(apiRefTab);
}

function generateSDKNav(sdkName, sdkPath) {
  const result = {
    group: sdkName,
    pages: [`api-reference/${sdkName}/README`]
  };

  const sdkDir = path.join(apiRefBasePath, sdkName);
  const entries = fs.readdirSync(sdkDir, { withFileTypes: true });
  const subdirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));

  if (subdirs.length > 0 && subdirs.some(s => ['abilityClient', 'jwt', 'webAuthClient', 'expressMiddleware'].includes(s.name))) {
    subdirs.forEach(subdir => {
      const moduleName = subdir.name;
      const modulePath = path.join(sdkDir, moduleName);
      
      const moduleNav = {
        group: moduleName,
        pages: [`api-reference/${sdkName}/${moduleName}/README`]
      };

      if (moduleName === 'jwt') {
        const accessors = ['getAppInfo', 'getAudience', 'getAuthentication', 'getIssuerAddress', 'getPKPInfo', 'getPublicKey', 'getRole', 'getSubjectAddress'];
        moduleNav.pages.push({
          group: 'Accessors',
          pages: accessors.map(f => `api-reference/${sdkName}/${moduleName}/functions/${f}`)
        });

        const create = ['createAppUserJWT', 'createDelegateeJWT', 'createPlatformUserJWT'];
        moduleNav.pages.push({
          group: 'Create',
          pages: create.map(f => `api-reference/${sdkName}/${moduleName}/functions/${f}`)
        });

        const typeGuards = ['isAnyVincentJWT', 'isAppUser', 'isDelegatee', 'isPlatformUser'];
        moduleNav.pages.push({
          group: 'Type Guards',
          pages: typeGuards.map(f => `api-reference/${sdkName}/${moduleName}/functions/${f}`)
        });

        const verify = ['isExpired', 'verifyVincentAppUserJWT', 'verifyVincentDelegateeJWT', 'verifyVincentPlatformJWT'];
        moduleNav.pages.push({
          group: 'Verify',
          pages: verify.map(f => `api-reference/${sdkName}/${moduleName}/functions/${f}`)
        });
      } else {
        const functionsDir = path.join(modulePath, 'functions');
        if (fs.existsSync(functionsDir)) {
          const functions = fs.readdirSync(functionsDir)
            .filter(f => f.endsWith('.mdx'))
            .map(f => `api-reference/${sdkName}/${moduleName}/functions/${f.replace('.mdx', '')}`)
            .sort();

          if (functions.length > 0) {
            moduleNav.pages.push({
              group: 'Functions',
              pages: functions
            });
          }
        }

        const variablesDir = path.join(modulePath, 'variables');
        if (fs.existsSync(variablesDir)) {
          const variables = fs.readdirSync(variablesDir)
            .filter(f => f.endsWith('.mdx'))
            .map(f => `api-reference/${sdkName}/${moduleName}/variables/${f.replace('.mdx', '')}`)
            .sort();

          if (variables.length > 0) {
            moduleNav.pages.push({
              group: 'Variables',
              pages: variables
            });
          }
        }
      }

      const interfacesDir = path.join(modulePath, 'interfaces');
      if (fs.existsSync(interfacesDir)) {
        const interfaces = fs.readdirSync(interfacesDir)
          .filter(f => f.endsWith('.mdx'))
          .map(f => `api-reference/${sdkName}/${moduleName}/interfaces/${f.replace('.mdx', '')}`)
          .sort();
        
        if (interfaces.length > 0) {
          moduleNav.pages.push({
            group: 'Interfaces',
            pages: interfaces
          });
        }
      }

      const typeAliasesDir = path.join(modulePath, 'type-aliases');
      if (fs.existsSync(typeAliasesDir)) {
        const typeAliases = fs.readdirSync(typeAliasesDir)
          .filter(f => f.endsWith('.mdx'))
          .map(f => `api-reference/${sdkName}/${moduleName}/type-aliases/${f.replace('.mdx', '')}`)
          .sort();
        
        if (typeAliases.length > 0) {
          moduleNav.pages.push({
            group: 'Type Aliases',
            pages: typeAliases
          });
        }
      }

      result.pages.push(moduleNav);
    });
  } else {
    ['functions', 'variables', 'classes', 'interfaces', 'type-aliases', 'enumerations'].forEach(category => {
      const categoryDir = path.join(sdkDir, category);
      if (fs.existsSync(categoryDir)) {
        const files = fs.readdirSync(categoryDir)
          .filter(f => f.endsWith('.mdx'))
          .map(f => `api-reference/${sdkName}/${category}/${f.replace('.mdx', '')}`)
          .sort();

        if (files.length > 0) {
          const groupName = category.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
          result.pages.push({
            group: groupName,
            pages: files
          });
        }
      }
    });
  }

  return result;
}

const sdks = fs.readdirSync(apiRefBasePath, { withFileTypes: true })
  .filter(e => e.isDirectory() && !e.name.startsWith('.'))
  .map(e => e.name)
  .sort();

apiRefTab.groups = [];
sdks.forEach(sdk => {
  const sdkNav = generateSDKNav(sdk, path.join(apiRefBasePath, sdk));
  apiRefTab.groups.push(sdkNav);
});

fs.writeFileSync(docsJsonPath, JSON.stringify(docsJson, null, 2) + '\n');
console.log(`✅ Generated navigation for ${sdks.length} SDKs: ${sdks.join(', ')}`);
