// This file ensures that the tests run in the correct order
// First, we test the OpenAPI endpoints to ensure the API spec is available
import './openapi.spec';
// Then we test the core entity endpoints, in sequence since they all have mutations that could break eachother
import './ability.spec';
import './policy.spec';
import './app.spec';
import './appVersionAbility.spec';
import './supportedPolicies.spec';
import './authorization.spec';
import './paymentDB.spec';

// This empty test ensures that the file is recognized as a test file
describe('Integration Test Suite', () => {
  it('should run all integration tests', () => {
    expect(true).toBe(true);
  });
});
