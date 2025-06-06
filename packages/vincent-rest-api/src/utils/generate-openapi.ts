import fs from 'fs';
import path from 'path';
import { registry } from '../lib/openApi/baseRegistry';
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { addToRegistry as addPolicyToRegistry } from '../lib/openApi/policy';
import { addToRegistry as addToolToRegistry } from '../lib/openApi/tool';
import { addToRegistry as addAppToRegistry } from '../lib/openApi/app';

addAppToRegistry(registry);
addToolToRegistry(registry);
addPolicyToRegistry(registry);

const generator = new OpenApiGeneratorV3(registry.definitions);

const openApiDocument = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'Vincent Registry API',
    version: '1.0.0',
    description: 'API for Vincent App, Tool, and Policy Registry',
  },
});

const outputDir = path.resolve(__dirname, '../generated');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputFile = path.join(outputDir, 'openapi.json');
fs.writeFileSync(outputFile, JSON.stringify(openApiDocument, null, 2));

console.log(`OpenAPI document generated at ${outputFile}`);
