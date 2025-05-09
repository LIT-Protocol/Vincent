// src/lib/toolCore/execute.ts

import { ToolResponse, VincentToolDef } from '../types';
import { createToolFailureResult, createToolSuccessResult } from './helpers/resultCreators';
import { getSchemaForToolResponseResult } from './helpers/schemaHelpers';
import { isToolFailureResponse, isToolSuccessResponse } from './helpers/typeGuards';
import { BaseToolContext } from './toolContext/types';
import { validateOrFail } from './helpers/zod';
import { ZodType } from 'zod';
import { createVincentTool } from './vincentTool';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const execute = async <
  ToolParamsSchema extends ZodType<any, any, any>,
  ToolSuccessSchema extends ZodType<any, any, any> | undefined = undefined,
  ToolFailureSchema extends ZodType<any, any, any> | undefined = undefined,
>(
  toolDef: VincentToolDef<ToolParamsSchema, any[], any, any, ToolSuccessSchema, ToolFailureSchema>,
  args: {
    toolParams: unknown;
    context: BaseToolContext<any>;
  },
): Promise<ToolResponse<ToolSuccessSchema, ToolFailureSchema>> => {
  const { toolParams, context } = args;
  const { toolParamsSchema, executeSuccessSchema, executeFailSchema } = toolDef;

  try {
    const parsedToolParams = validateOrFail(toolParams, toolParamsSchema, 'execute', 'input');
    if (isToolFailureResponse(parsedToolParams)) {
      return parsedToolParams;
    }

    const tool = createVincentTool(toolDef);

    const result = await tool.execute(
      {
        toolParams: parsedToolParams,
      },
      context,
    );

    const { schemaToUse } = getSchemaForToolResponseResult({
      value: result,
      successResultSchema: executeSuccessSchema,
      failureResultSchema: executeFailSchema,
    });

    const parsed = validateOrFail(result.result, schemaToUse, 'execute', 'output');

    if (isToolFailureResponse(parsed)) {
      return parsed as ToolResponse<ToolSuccessSchema, ToolFailureSchema>;
    }

    if (isToolSuccessResponse(result)) {
      return createToolSuccessResult({ result: parsed });
    }

    if (isToolFailureResponse(result)) {
      return createToolFailureResult({ message: result.error, result: parsed });
    }

    return createToolFailureResult({ message: 'Tool returned invalid result shape' });
  } catch (err) {
    return createToolFailureResult({
      message: err instanceof Error ? err.message : 'Unknown error in tool execution',
    });
  }
};
