import fs from 'fs';
import path from 'path';
import { registry } from '../api/api';
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

const generator = new OpenApiGeneratorV3(registry.definitions);

const openApiDocument = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'Vincent API',
    version: '1.0.0',
    description: 'API for Vincent SDK',
  },
  servers: [{ url: '/api/v1' }],
});

const outputDir = path.resolve(__dirname, '../generated');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputFile = path.join(outputDir, 'openapi.json');
fs.writeFileSync(outputFile, JSON.stringify(openApiDocument, null, 2));

console.log(`OpenAPI document generated at ${outputFile}`);
