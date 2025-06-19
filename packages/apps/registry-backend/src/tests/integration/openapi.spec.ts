import { createClient } from './setup';

describe('OpenAPI Integration Tests', () => {
  const client = createClient();

  describe('GET /openApiJson', () => {
    it('should return the OpenAPI JSON specification', async () => {
      const response = await client.get('/openApiJson');
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.openapi).toBeDefined();
      expect(response.body.paths).toBeDefined();
    });
  });

  describe('GET /openapi', () => {
    it('should return the OpenAPI HTML documentation page', async () => {
      const response = await client.get('/openapi');
      expect(response.status).toBe(200);
      expect(response.text).toContain('<!doctype html>');
      expect(response.text).toContain('<rapi-doc spec-url="/openApiJson"');
    });
  });
});
