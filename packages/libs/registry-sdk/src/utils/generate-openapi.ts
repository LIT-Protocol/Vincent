import fs from 'fs';
import path from 'path';

import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

import { addToRegistry as addAbilityToRegistry } from '../lib/openApi/ability';
import { addToRegistry as addAppToRegistry } from '../lib/openApi/app';
import { registry } from '../lib/openApi/baseRegistry';
import { addToRegistry as addPolicyToRegistry } from '../lib/openApi/policy';
import { addToRegistry as addUserToRegistry } from '../lib/openApi/user';

addAppToRegistry(registry);
addAbilityToRegistry(registry);
addPolicyToRegistry(registry);
addUserToRegistry(registry);

const generator = new OpenApiGeneratorV3(registry.definitions);

const openApiDocument = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'Vincent Registry API',
    version: '1.0.3',
    description: 'API for Vincent App, Ability, and Policy Registry',
  },
  servers: [
    { url: 'https://api.heyvincent.ai' },
    { url: 'https://staging.api.heyvincent.ai' },
    { url: 'http://localhost:3000/' },
  ],
});

const outputDir = path.resolve(__dirname, '../generated');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputFile = path.join(outputDir, 'openapi.json');
fs.writeFileSync(outputFile, JSON.stringify(openApiDocument, null, 2));

console.log(`OpenAPI document generated at ${outputFile}`);
