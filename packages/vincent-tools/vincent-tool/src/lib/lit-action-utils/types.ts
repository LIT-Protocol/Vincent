export interface VincentToolSuccess {
    status: 'success';
    details: string[];
}

export interface VincentToolError {
    status: 'error';
    details: string[];
}

export type VincentToolResponse = VincentToolSuccess | VincentToolError;

export interface VincentToolPolicySuccess {
    allow: true;
    details: string[];
}

export interface VincentToolPolicyError {
    allow: false;
    details: string[];
}

export type VincentToolPolicyResponse = VincentToolPolicySuccess | VincentToolPolicyError;
