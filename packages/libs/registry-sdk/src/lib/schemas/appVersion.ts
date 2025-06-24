import { z } from './openApiZod';

import { baseDocAttributes } from './base';

const appVersion = z
  .object({
    appId: z.number().openapi({
      description: 'Application ID',
      example: 12312345,
      readOnly: true,
    }),
    version: z.number().openapi({
      description: 'App Version number',
      example: 1,
    }),
    enabled: z.boolean().openapi({
      description: 'Whether this version is enabled or not',
      example: true,
    }),
    // Will not be set on appVersion 1; expected on all subsequent appVersions
    changes: z.string().optional().openapi({
      description: 'Describes what changed between this version and the previous version.',
      example: 'I am a changelog trapped in a computer!',
    }),
  })
  .strict();

// Avoiding using z.omit() or z.pick() due to excessive TS type inference costs
function buildCreateAppVersionSchema() {
  // New app versions are always enabled === false; the property cannot be set by creator
  const { appId, version, changes } = appVersion.shape;

  return z
    .object({
      // Optional
      ...z.object({ changes }).partial().strict().shape,

      // Required
      appId,
      version,
    })
    .strict();
}

export const appVersionCreate = buildCreateAppVersionSchema();

// Avoiding using z.omit() or z.pick() due to excessive TS type inference costs
function buildEditAppVersionSchema() {
  const { appId, version, changes, enabled } = appVersion.shape;

  return z
    .object({
      // Optional
      ...z.object({ changes, enabled }).partial().strict().shape,

      // Required
      appId,
      version,
    })
    .strict();
}

export const appVersionEdit = buildEditAppVersionSchema();

const appVersionTool = z
  .object({
    appId: z.number().openapi({
      description: 'Application ID',
      example: 5,
      readOnly: true,
    }),
    appVersion: z.number().openapi({
      description: 'Application version',
      example: 2,
    }),
    toolPackageName: z.string().openapi({
      description: 'Tool package name',
      example: '@vincent/foo-bar',
    }),
    toolVersion: z.string().openapi({
      description: 'Tool version',
      example: '1.0.0',
    }),
    hiddenSupportedPolicies: z
      .array(z.string())
      .optional()
      .openapi({
        description:
          'Policies that are supported by this tool, but are hidden from users of this app specifically',
        example: ['@vincent/foo-bar-policy-1', '@vincent/foo-bar-policy-2'],
      }),
  })
  .strict();

// Avoiding using z.omit() or z.pick() due to excessive TS type inference costs
function buildCreateAppVersionToolSchema() {
  const { appId, appVersion, toolPackageName, toolVersion, hiddenSupportedPolicies } =
    appVersionTool.shape;

  return z
    .object({
      // Optional
      ...z.object({ hiddenSupportedPolicies }).partial().strict().shape,

      // Required
      appId,
      appVersion,
      toolPackageName,
      toolVersion,
    })
    .strict();
}

export const appVersionToolCreate = buildCreateAppVersionToolSchema();

/** appVersionToolRead describes a complete application version's tool document, with all properties including those that are database-backend
 * specific like _id and updated/created at timestamps.
 *
 * All schemas that need to be composed as subsets of this schema
 * should be derived from `appVersionTool` instead
 */
export const appVersionToolRead = z
  .object({
    ...baseDocAttributes.shape,
    ...appVersionTool.shape,
  })
  .strict();

/** appVersionRead describes a complete application version document, with all properties including those that are database-backend
 * specific like _id and updated/created at timestamps.
 *
 * All schemas that need to be composed as subsets of this schema
 * should be derived from `appVersion` instead
 */
export const appVersionRead = z
  .object({
    ...baseDocAttributes.shape,
    ...appVersion.shape,
  })
  .strict();
