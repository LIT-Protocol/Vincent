# Registry Backend Tests

This directory contains tests for the Registry Backend API.

## Integration Tests

The integration tests verify that the API endpoints work correctly by starting a local development server and making HTTP requests to it. These tests use:

- **Jest** as the test runner
- **jest-process-manager** to manage the development server lifecycle
- **supertest** to make HTTP requests to the API

### Test Structure

The integration tests are organized by API resource:

- `tool.spec.ts` - Tests for the Tool API endpoints
- `policy.spec.ts` - Tests for the Policy API endpoints
- `app.spec.ts` - Tests for the App API endpoints
- `openapi.spec.ts` - Tests for the OpenAPI documentation endpoints
- `index.spec.ts` - Entry point that imports all test files and ensures they run in the correct order

### Running the Tests

To run the integration tests:

```bash
pnpm test:integration
```

This will:

1. Start a local development server
2. Run all the integration tests
3. Shut down the server when tests are complete

### Test Approach

The integration tests follow these principles:

1. **Isolation**: Each test suite creates its own test data with unique identifiers
2. **API-only verification**: Tests only use the API to verify results, not direct database access
3. **Cleanup**: Test data is deleted at the end of each test suite
4. **Complete coverage**: All API endpoints are tested

### Adding New Tests

When adding new API endpoints, please add corresponding integration tests that:

1. Test the happy path (successful operation)
2. Test error cases (invalid input, not found, etc.)
3. Verify the operation succeeded using only API calls
