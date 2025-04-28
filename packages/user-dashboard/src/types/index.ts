import { AppView } from "@/services/types";

interface PolicyParameter {
    name: string;
    type: string;
}

interface Policy {
    policyIpfsCid: string;
    parameters: PolicyParameter[];
}

interface ToolPolicy {
    toolIpfsCid?: string;
    policies?: Policy[];
    [key: string]: any;
}

interface PolicyParameterWithId extends PolicyParameter {
    _id: string;
}

interface PolicyWithId extends Policy {
    _id: string;
    parameters: PolicyParameterWithId[];
}

interface ToolPolicyWithId extends ToolPolicy {
    _id: string;
    policies: PolicyWithId[];
}

interface ToolPolicyManagerProps {
    onBack: () => void;
    dashboard: AppView;
}

export type { PolicyParameter, Policy, ToolPolicy, PolicyParameterWithId, PolicyWithId, ToolPolicyWithId, ToolPolicyManagerProps };