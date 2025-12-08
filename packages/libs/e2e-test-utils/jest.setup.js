// Mock ESM-only modules that are imported by compiled dependencies
jest.mock('cbor2', () => ({
  decode: jest.fn(),
  encode: jest.fn(),
  decodeSequence: jest.fn(),
  diagnose: jest.fn(),
  comment: jest.fn(),
}));

jest.mock('@t3-oss/env-core', () => ({
  createEnv: jest.fn((config) => {
    const env = config.runtimeEnv || process.env;
    const schema = config.server || {};

    // Apply defaults from the schema
    const result = { ...env };
    for (const [key, validator] of Object.entries(schema)) {
      if (result[key] === undefined || result[key] === '') {
        // Check if validator has a default
        if (validator && validator._def && validator._def.defaultValue) {
          result[key] = validator._def.defaultValue();
        }
      }
    }

    return result;
  }),
}));
