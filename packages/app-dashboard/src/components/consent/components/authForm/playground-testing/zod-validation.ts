import { z } from 'zod';

const BasicTypes = z.union([
  z.literal('string'),
  z.literal('number'),
  z.literal('integer'),
  z.literal('boolean'),
  z.literal('array'),
  z.literal('object'),
]);

const EnumValues = z.array(z.union([z.string(), z.number()]));

type JsonSchemaFieldType = z.ZodType<any, any, any>;

const JsonSchemaField: z.ZodType = z.lazy(() =>
  z.union([JsonSchemaPrimitiveField, z.array(z.lazy(() => JsonSchemaField))]),
);

const JsonSchemaPrimitiveField: JsonSchemaFieldType = z
  .object({
    type: BasicTypes.optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    enum: EnumValues.optional(),
    default: z.any().optional(),
    format: z.string().optional(),
    minimum: z.number().optional(),
    maximum: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),

    uniqueItems: z.boolean().optional(),
    additionalItems: z.union([z.boolean(), z.lazy(() => JsonSchemaField)]).optional(),
    minItems: z.number().optional(),
    maxItems: z.number().optional(),

    const: z.any().optional(),
    examples: z.array(z.any()).optional(),
    additionalProperties: z.union([z.boolean(), z.lazy(() => JsonSchemaField)]).optional(),
    patternProperties: z.record(z.lazy(() => JsonSchemaField)).optional(),
    dependencies: z
      .record(z.union([z.array(z.string()), z.lazy(() => JsonSchemaField)]))
      .optional(),
    allOf: z.array(z.lazy(() => JsonSchemaField)).optional(),
    not: z.lazy(() => JsonSchemaField).optional(),
    if: z.lazy(() => JsonSchemaField).optional(),
    then: z.lazy(() => JsonSchemaField).optional(),
    else: z.lazy(() => JsonSchemaField).optional(),

    items: z.lazy(() => JsonSchemaField).optional(), // This can be object or array
    oneOf: z.array(z.lazy(() => JsonSchemaField)).optional(),
    anyOf: z.array(z.lazy(() => JsonSchemaField)).optional(),
    properties: z.record(z.lazy(() => JsonSchemaField)).optional(),
    required: z.array(z.string()).optional(),
  })
  .strict();

export const PolicyJsonSchema = z
  .object({
    type: z.literal('object'),
    properties: z.record(JsonSchemaField),
    required: z.array(z.string()).optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    definitions: z.record(z.any()).optional(),
  })
  .strict();

type PolicyUiSchemaType = z.ZodType<any, any, any>;

const PolicyUiSchemaInner: PolicyUiSchemaType = z.union([
  z.record(
    z
      .string()
      .refine(
        (key) =>
          key.startsWith('ui:') ||
          ['classNames', 'options', 'items', 'additionalItems'].includes(key),
        {
          message: "UI schema keys should start with 'ui:' or be a standard key like 'classNames'",
        },
      ),
    z.any(),
  ),
  z.lazy(() => PolicyUiSchema),
]);

export const PolicyUiSchema: PolicyUiSchemaType = z.record(PolicyUiSchemaInner);

export const PolicyDefinition = z.object({
  jsonSchema: PolicyJsonSchema,
  uiSchema: PolicyUiSchema,
});
