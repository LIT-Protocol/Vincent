import { z, ZodRawShape } from 'zod';

const ParameterType = [
  'number',
  'number_array',
  'bool',
  'bool_array',
  'address',
  'address_array',
  'string',
  'string_array',
  'bytes',
  'bytes_array',
] as const;
const ParameterTypeEnum = z.enum(ParameterType);
export type ParameterType = z.infer<typeof ParameterTypeEnum>;

const ZodSchemaMap: Record<ParameterType, z.ZodTypeAny> = {
  number: z.string().refine((val) => val === '' || val === '-' || !isNaN(parseInt(val)), {
    message: 'Must be a valid integer or empty',
  }),
  number_array: z.string().refine(
    (val) =>
      val === '' ||
      val.split(',').every((item) => {
        const trimmed = item.trim();
        return trimmed === '' || trimmed === '-' || !isNaN(parseInt(trimmed));
      }),
    {
      message: 'Must be comma-separated integers or empty',
    }
  ),
  bool: z.boolean(),
  bool_array: z.string().refine(
    (val) =>
      val === '' ||
      val.split(',').every((item) => {
        const trimmed = item.trim().toLowerCase();
        return (
          trimmed === '' || ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(trimmed)
        );
      }),
    {
      message: 'Must be comma-separated boolean values or empty',
    }
  ),
  address: z.string().regex(/^(0x[a-fA-F0-9]{40}|0x\.\.\.|)$/, {
    message: 'Must be a valid Ethereum address, 0x..., or empty',
  }),
  address_array: z.string().refine(
    (val) =>
      val === '' ||
      val.split(',').every((item) => {
        const trimmed = item.trim();
        return trimmed === '' || trimmed === '0x...' || /^0x[a-fA-F0-9]{40}$/.test(trimmed);
      }),
    {
      message: 'Must be comma-separated Ethereum addresses or empty',
    }
  ),
  string: z.string(),
  string_array: z.string(),
  bytes: z.string(),
  bytes_array: z.string(),
} as const;

export function buildParamDefinitions(params: VincentParameter[]) {
  return params.reduce((acc, param) => {
    const zodSchema = ZodSchemaMap[param.type] || z.string();
    acc[param.name] = zodSchema.describe(param.description);
    return acc;
  }, {} as ZodRawShape);
}

export const VincentParameterSchema = z.object({
  name: z.string(),
  type: ParameterTypeEnum,
  description: z.string(),
});
export type VincentParameter = z.infer<typeof VincentParameterSchema>;

export const VincentToolDefSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.array(VincentParameterSchema),
});
export type VincentToolDef = z.infer<typeof VincentToolDefSchema>;

export type VincentToolDefWithIPFS = VincentToolDef & { ipfsCid: string };

export const VincentAppDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  tools: z.record(VincentToolDefSchema),
});

export type VincentAppDef = z.infer<typeof VincentAppDefSchema>;
