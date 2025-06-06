import { z } from './openApiZod';

export const BaseDocAttributes = z.object({
  _id: z.string().openapi({ description: 'Document ID', readOnly: true }),
  updatedAt: z.string().datetime().openapi({
    description: 'Timestamp when this was last modified',
  }),
  createdAt: z.string().datetime().openapi({ description: 'Timestamp when this was created' }),
});

// Error response
export const Error = z.object({
  code: z.string().optional().openapi({
    description: 'Error code',
    example: 'VALIDATION_ERROR',
  }),
  message: z.string().openapi({
    description: 'Error message',
    example: 'Invalid input provided',
  }),
});

// Request body for updating a tool version
export const VersionChanges = z.object({
  changes: z.string().openapi({
    description: 'Updated changelog information',
    example: 'Updated changelog information',
  }),
});

// Response body for deleting an application
export const DeleteResponse = z.object({
  message: z.string().openapi({
    description: 'Success message',
    example: 'Application successfully deleted',
  }),
});
