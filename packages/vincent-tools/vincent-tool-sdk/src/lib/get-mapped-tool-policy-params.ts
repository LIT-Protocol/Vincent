import { z } from "zod";

export const getMappedToolPolicyParams = ({
    toolParameterMappings,
    parsedToolParams,
}: {
    toolParameterMappings: Record<string, string>,
    parsedToolParams: z.infer<any>
}) => {
    const mappedToolParams: Record<string, unknown> = {};
    for (const [toolParamKey, policyParamKey] of Object.entries(toolParameterMappings)) {
        if (!policyParamKey) {
            throw new Error(`Missing policy param key for tool param "${toolParamKey}" (evaluateSupportedPolicies)`);
        }

        if (!(toolParamKey in parsedToolParams)) {
            throw new Error(
                `Tool param "${toolParamKey}" expected in toolParams but was not provided`
            );
        }

        mappedToolParams[policyParamKey as string] =
            parsedToolParams[toolParamKey as keyof typeof parsedToolParams];
    }

    return mappedToolParams;
}