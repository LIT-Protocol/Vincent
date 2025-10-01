#!/usr/bin/env node
import { execSync } from 'child_process';

const sdks = ['mintlify', 'ability-sdk', 'contracts-sdk'];

console.log('🚀 Generating documentation for all SDKs...\n');

for (const sdk of sdks) {
  console.log(`📚 Generating docs for ${sdk}...`);
  execSync(`npx typedoc --options typedoc.${sdk}.json`, { stdio: 'inherit' });
}

console.log('\n📋 Generating navigation structure...');
execSync('node generate-docs-nav.mjs', { stdio: 'inherit' });

console.log('\n✅ All documentation generated successfully!');
