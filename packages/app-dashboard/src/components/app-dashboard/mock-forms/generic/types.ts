// Entity types and data shape definitions

export type EntityType = 'app' | 'tool' | 'policy';

export interface IDeleteResponse {
  success: boolean;
  message: string;
  deletedId?: number;
}

// Utility type for extracting entity data shape
export type EntityDataShape<T extends EntityType> = T extends 'app'
  ? {
      appId: number;
      name: string;
      description: string;
      contactEmail: string;
      appUserUrl: string;
      redirectUris: string[];
      deploymentStatus: 'dev' | 'test' | 'prod';
      logo?: string;
      activeVersion: number;
      lastUpdated: string;
      managerAddress: string;
    }
  : T extends 'tool'
    ? {
        packageName: string;
        toolTitle: string;
        description: string;
        activeVersion: string;
        authorWalletAddress: string;
      }
    : T extends 'policy'
      ? {
          packageName: string;
          policyTitle: string;
          description: string;
          activeVersion: string;
          authorWalletAddress: string;
        }
      : never;

// Form-related types
export interface ValidationRule<T = any> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | undefined;
  message?: string;
}

export interface FormField<T = string> {
  value: T;
  error?: string;
  rules?: ValidationRule<T>;
  schema?: any; // Zod schema type
}

export type FormSchema<T> = {
  [K in keyof T]: FormField<T[K]>;
};
