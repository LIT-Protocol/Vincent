// This file ensures that the tests run in the correct order
// First, we test the OpenAPI endpoints to ensure the API spec is available
import './openapi.spec';

// Then we test the core entity endpoints
import './tool.spec';
import './policy.spec';
import './app.spec';

// This empty test ensures that the file is recognized as a test file
describe('Integration Test Suite', () => {
  it('should run all integration tests', () => {
    expect(true).toBe(true);
  });
});
