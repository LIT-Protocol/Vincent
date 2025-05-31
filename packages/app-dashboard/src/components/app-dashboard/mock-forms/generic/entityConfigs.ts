import { EntityType } from './types';
import { schemas, validateWithSchema } from './validation';

// Define operation permissions for each entity type
export const ENTITY_OPERATIONS = {
  app: {
    get: true,
    update: true,
    delete: true,
    create: false,
    changeOwner: false,
    getAll: false,
    getVersions: true,
    getVersion: true,
    editVersion: true,
    createVersion: false,
  },
  tool: {
    get: true,
    update: true,
    delete: false,
    create: true,
    changeOwner: true,
    getAll: true,
    getVersions: true,
    getVersion: true,
    editVersion: true,
    createVersion: true,
  },
  policy: {
    get: true,
    update: true,
    delete: false,
    create: true,
    changeOwner: true,
    getAll: true,
    getVersions: true,
    getVersion: true,
    editVersion: true,
    createVersion: true,
  },
} as const;

// Enhanced entity configuration using Zod schemas instead of regex
export const ENTITY_CONFIGS = {
  app: {
    name: 'app',
    displayName: 'Application',
    idLabel: 'App ID',
    idPlaceholder: 'Enter app ID (e.g., 123)',
    idSchema: schemas.appId(),
    operations: ENTITY_OPERATIONS.app,
    fields: {
      identifier: 'appId',
      identifierType: 'number' as const,
    },
  },
  tool: {
    name: 'tool',
    displayName: 'Tool',
    idLabel: 'Package Name',
    idPlaceholder: '@org/tool-name',
    idSchema: schemas.packageName(),
    operations: ENTITY_OPERATIONS.tool,
    fields: {
      identifier: 'packageName',
      identifierType: 'string' as const,
      titleField: 'toolTitle',
    },
  },
  policy: {
    name: 'policy',
    displayName: 'Policy',
    idLabel: 'Package Name',
    idPlaceholder: '@org/policy-name',
    idSchema: schemas.packageName(),
    operations: ENTITY_OPERATIONS.policy,
    fields: {
      identifier: 'packageName',
      identifierType: 'string' as const,
      titleField: 'policyTitle',
    },
  },
} as const;

// Helper function to validate entity ID using Zod
export const validateEntityId = (entityType: EntityType, value: string): string | undefined => {
  const config = ENTITY_CONFIGS[entityType];
  return validateWithSchema(config.idSchema, value);
};
