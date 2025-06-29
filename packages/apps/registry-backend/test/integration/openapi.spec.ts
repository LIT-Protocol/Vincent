describe('OpenAPI Integration Tests', () => {
  const baseUrl = `http://localhost:${process.env.PORT || 3000}`;

  describe('GET /openApiJson', () => {
    it('should return the OpenAPI JSON specification', async () => {
      const response = await fetch(`${baseUrl}/openApiJson`);
      const data = await response.json();

      expect(response.status).toBe(200);
      const dataAsObj = data as Record<string, unknown>;
      expect(dataAsObj.openapi).toBeDefined();
      expect(dataAsObj.paths).toBeDefined();
    });
  });

  describe('GET /openapi', () => {
    it('should return the OpenAPI HTML documentation page', async () => {
      const response = await fetch(`${baseUrl}/openapi`);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(text).toContain('<!doctype html>');
      expect(text).toContain('<rapi-doc');
    });
  });
});
