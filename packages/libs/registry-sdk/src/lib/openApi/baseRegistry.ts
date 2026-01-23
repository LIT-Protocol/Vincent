import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import { genericResultMessage, errorResult } from '../schemas/base';
import { changeOwner } from '../schemas/packages';

const registry = new OpenAPIRegistry();

// Define 'global' references that are used in multiple routes
export const ErrorResponse = registry.register('Error', errorResult);
export const GenericResult = registry.register('GenericResultMessage', genericResultMessage);
export const ChangeOwner = registry.register('ChangeOwner', changeOwner);

// Define security schemes
export const siweAuth = registry.registerComponent('securitySchemes', 'siweAuth', {
  type: 'apiKey',
  in: 'header',
  name: 'Authorization',
  description: `Sign In With Ethereum authentication (SIWE). Format is "SIWE [JSON({ message, signature })]"`,
});

// Export the registry
export { registry };
