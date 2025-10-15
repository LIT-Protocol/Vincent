#!/usr/bin/env node
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '../..');

const sdks = ['app-sdk', 'ability-sdk', 'contracts-sdk'];

console.log('🚀 Generating documentation for all SDKs...\n');

for (const sdk of sdks) {
  console.log(`📚 Generating docs for ${sdk}...`);
  execSync(`npx typedoc --options typedoc.${sdk}.json`, {
    stdio: 'inherit',
    cwd: rootDir
  });
}

console.log('\n📋 Generating navigation structure...');
execSync('node scripts/docs/generate-docs-nav.mjs', {
  stdio: 'inherit',
  cwd: rootDir
});

console.log('\n✅ All documentation generated successfully!');
