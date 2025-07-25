import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import { genericResultMessage, errorResult } from '../schemas/base';
import { changeOwner } from '../schemas/packages';

const registry = new OpenAPIRegistry();

// Define 'global' references that are used in multiple routes
export const ErrorResponse = registry.register('Error', errorResult);
export const GenericResult = registry.register('GenericResultMessage', genericResultMessage);
export const ChangeOwner = registry.register('ChangeOwner', changeOwner);

// Define security schemes
export const jwtAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Vincent-issued JWTs must be used for these endpoints.',
});

// Export the registry
export { registry };
