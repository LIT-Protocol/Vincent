import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { deleteResult, errorResult } from '../schemas/base';
import { changeOwner } from '../schemas/packages';

const registry = new OpenAPIRegistry();

// Define 'global' references that are used in multiple routes
export const ErrorResponse = registry.register('Error', errorResult);
export const DeleteResponse = registry.register('DeleteResponse', deleteResult);
export const ChangeOwner = registry.register('ChangeOwner', changeOwner);

// Define security schemes
export const siweAuth = registry.registerComponent('securitySchemes', 'siweAuth', {
  type: 'apiKey',
  in: 'header',
  name: 'Authorization',
  description: `Sign In With Ethereum authentication (SIWE). Format is "SIWE [Base64EncodedSignedSiwe]"`,
});

// Export the registry
export { registry };
