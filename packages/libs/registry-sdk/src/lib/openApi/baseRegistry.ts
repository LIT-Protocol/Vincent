import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { DeleteResponse, Error, VersionChanges } from '../schemas/base';
import { ChangeOwner } from '../schemas/packages';

const registry = new OpenAPIRegistry();

// Define 'global' references that are used in multiple routes
export const ErrorSchema = registry.register('Error', Error);
export const DeleteResponseSchema = registry.register('DeleteResponse', DeleteResponse);
export const VersionChangesSchema = registry.register('VersionChanges', VersionChanges);
export const ChangeOwnerSchema = registry.register('ChangeOwner', ChangeOwner);

// Export the registry
export { registry };
