import { EntityType, IDeleteResponse } from './types';

// Define proper types for each entity
interface AppEntity {
  identity: string;
  appId: number;
  name: string;
  description: string;
  contactEmail: string;
  appUserUrl: string;
  logo?: string;
  redirectUris: string[];
  deploymentStatus: 'dev' | 'test' | 'prod';
  activeVersion: number;
  lastUpdated: string;
  managerAddress: string;
}

interface ToolEntity {
  packageName: string;
  toolTitle: string;
  identity: string;
  authorWalletAddress: string;
  description: string;
  activeVersion: string;
}

interface PolicyEntity {
  packageName: string;
  policyTitle: string;
  identity: string;
  authorWalletAddress: string;
  description: string;
  activeVersion: string;
}

// Type-safe entity map
type EntityMap = {
  app: AppEntity;
  tool: ToolEntity;
  policy: PolicyEntity;
};

// Generic API service class
export class EntityAPIService<T extends EntityType> {
  private entityType: T;

  constructor(entityType: T) {
    this.entityType = entityType;
  }

  async get(id: string): Promise<EntityMap[T]> {
    // In real implementation, this would be an API call
    return mockGetFunctions[this.entityType](id) as Promise<EntityMap[T]>;
  }

  async update(data: Partial<EntityMap[T]>): Promise<EntityMap[T]> {
    // In real implementation, this would be an API call
    switch (this.entityType) {
      case 'app':
        return (await mockEditFunctions.app(data as Partial<AppEntity>)) as EntityMap[T];
      case 'tool':
        return (await mockEditFunctions.tool(data as Partial<ToolEntity>)) as EntityMap[T];
      case 'policy':
        return (await mockEditFunctions.policy(data as Partial<PolicyEntity>)) as EntityMap[T];
      default:
        throw new Error(`Unknown entity type: ${this.entityType}`);
    }
  }

  async delete(id: string): Promise<IDeleteResponse> {
    if (this.entityType !== 'app') {
      throw new Error(`Delete operation not supported for ${this.entityType}`);
    }
    return mockDeleteFunctions.app(id);
  }

  async create(data: Partial<EntityMap[T]>): Promise<EntityMap[T]> {
    if (this.entityType === 'app') {
      throw new Error('Create operation not supported for apps');
    }
    return mockCreateFunctions[this.entityType as 'tool' | 'policy'](data as any) as Promise<
      EntityMap[T]
    >;
  }

  async changeOwner(data: {
    packageName: string;
    authorWalletAddress: string;
  }): Promise<EntityMap[T]> {
    if (this.entityType === 'app') {
      throw new Error('Change owner operation not supported for apps');
    }
    return mockChangeOwnerFunctions[this.entityType as 'tool' | 'policy'](data) as Promise<
      EntityMap[T]
    >;
  }

  async getAll(): Promise<string[]> {
    if (this.entityType === 'app') {
      throw new Error('Get all operation not supported for apps');
    }
    return mockGetAllFunctions[this.entityType as 'tool' | 'policy']();
  }

  // Version operations
  async getVersions(entityId: string): Promise<any[]> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return mockVersionFunctions.getVersions[
      this.entityType as keyof typeof mockVersionFunctions.getVersions
    ](entityId);
  }

  async getVersion(data: any): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return mockVersionFunctions.getVersion[
      this.entityType as keyof typeof mockVersionFunctions.getVersion
    ](data);
  }

  async editVersion(data: any): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return mockVersionFunctions.editVersion[
      this.entityType as keyof typeof mockVersionFunctions.editVersion
    ](data);
  }

  async createVersion(data: any): Promise<any> {
    if (this.entityType === 'app') {
      throw new Error(
        'Apps cannot create versions through this form - use blockchain-specific version creation',
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
    return mockVersionFunctions.createVersion[this.entityType as 'tool' | 'policy'](data);
  }
}

// Keep mock functions private to this module
const mockGetFunctions = {
  app: async (id: string): Promise<AppEntity> => ({
    identity: `AppDef|${id}`,
    appId: parseInt(id),
    name: 'Sample App',
    description: 'This is a sample application for testing',
    contactEmail: 'contact@example.com',
    appUserUrl: 'https://sample-app.com',
    logo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
    redirectUris: ['https://sample-app.com/callback'],
    deploymentStatus: 'dev',
    activeVersion: 1,
    lastUpdated: new Date().toISOString(),
    managerAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
  }),

  tool: async (packageName: string): Promise<ToolEntity> => ({
    packageName: packageName,
    toolTitle: 'Sample Tool',
    identity: `ToolDef|${packageName}`,
    authorWalletAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
    description: 'This tool is a foo bar tool',
    activeVersion: '1.0.0',
  }),

  policy: async (packageName: string): Promise<PolicyEntity> => ({
    packageName: packageName,
    policyTitle: 'Sample Policy',
    identity: `PolicyDef|${packageName}`,
    authorWalletAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
    description: 'This policy is a foo bar policy',
    activeVersion: '1.0.0',
  }),
};

const mockEditFunctions = {
  app: async (data: Partial<AppEntity>): Promise<AppEntity> =>
    ({
      ...mockGetFunctions.app(data.appId?.toString() || '1'),
      ...data,
      identity: `AppDef|${data.appId}`,
      appId: parseInt(data.appId?.toString() || '1'),
      lastUpdated: new Date().toISOString(),
      managerAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
    }) as AppEntity,

  tool: async (data: Partial<ToolEntity>): Promise<ToolEntity> =>
    ({
      ...data,
      identity: `ToolDef|${data.packageName}`,
      authorWalletAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
    }) as ToolEntity,

  policy: async (data: Partial<PolicyEntity>): Promise<PolicyEntity> =>
    ({
      ...data,
      identity: `PolicyDef|${data.packageName}`,
      authorWalletAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
    }) as PolicyEntity,
};

const mockDeleteFunctions = {
  app: async (id: string): Promise<IDeleteResponse> => ({
    success: true,
    message: `App ${id} has been successfully deleted`,
    deletedId: parseInt(id),
  }),
};

const mockCreateFunctions = {
  tool: async (data: {
    packageName: string;
    title: string;
    description: string;
  }): Promise<ToolEntity> => ({
    packageName: data.packageName,
    toolTitle: data.title,
    identity: `ToolDef|${data.packageName}`,
    authorWalletAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
    description: data.description,
    activeVersion: '1.0.0',
  }),

  policy: async (data: {
    packageName: string;
    title: string;
    description: string;
  }): Promise<PolicyEntity> => ({
    packageName: data.packageName,
    policyTitle: data.title,
    identity: `PolicyDef|${data.packageName}`,
    authorWalletAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
    description: data.description,
    activeVersion: '1.0.0',
  }),
};

const mockChangeOwnerFunctions = {
  tool: async (data: {
    packageName: string;
    authorWalletAddress: string;
  }): Promise<ToolEntity> => ({
    packageName: data.packageName,
    toolTitle: 'Sample Tool',
    identity: `ToolDef|${data.packageName}`,
    authorWalletAddress: data.authorWalletAddress,
    description: 'This tool ownership has been transferred',
    activeVersion: '1.0.0',
  }),

  policy: async (data: {
    packageName: string;
    authorWalletAddress: string;
  }): Promise<PolicyEntity> => ({
    packageName: data.packageName,
    policyTitle: 'Sample Policy',
    identity: `PolicyDef|${data.packageName}`,
    authorWalletAddress: data.authorWalletAddress,
    description: 'This policy ownership has been transferred',
    activeVersion: '1.0.0',
  }),
};

const mockGetAllFunctions = {
  tool: async (): Promise<string[]> => [
    '@vincent/file-upload',
    '@vincent/data-validator',
    '@vincent/tool-data-fetch',
    '@vincent/tool-email-sender',
    '@vincent/tool-file-processor',
    '@vincent/tool-database-query',
    '@vincent/tool-webhook-handler',
    '@vincent/tool-image-processor',
    '@vincent/tool-text-analyzer',
    '@vincent/tool-scheduler',
  ],

  policy: async (): Promise<string[]> => [
    '@vincent/kyc-verification',
    '@vincent/risk-assessment',
    '@vincent/policy-data-privacy',
    '@vincent/policy-rate-limiting',
    '@vincent/policy-authentication',
    '@vincent/policy-logging',
    '@vincent/policy-validation',
    '@vincent/policy-caching',
  ],
};

const mockVersionFunctions = {
  getVersions: {
    app: async (entityId: string): Promise<any[]> => [
      {
        appId: parseInt(entityId),
        version: 1,
        identity: `AppVersionDef|${entityId}@1`,
        tools: ['@vincent/tool-1@1.0.0'],
        changes: 'Initial release',
        createdAt: '2024-01-01T00:00:00Z',
        isActive: true,
      },
      {
        appId: parseInt(entityId),
        version: 2,
        identity: `AppVersionDef|${entityId}@2`,
        tools: ['@vincent/tool-1@1.0.1', '@vincent/tool-2@1.0.0'],
        changes: 'Added new tool integration',
        createdAt: '2024-01-15T00:00:00Z',
        isActive: false,
      },
    ],
    tool: async (entityId: string): Promise<any[]> => [
      {
        packageName: entityId,
        version: '1.0.0',
        identity: `ToolVersionDef|${entityId}@1.0.0`,
        changes: 'Initial release',
        supportedPolicies: ['@vincent/policy-1'],
        repository: [`https://github.com/vincent/${entityId}`],
        keywords: ['tool'],
        dependencies: ['@vincent/sdk'],
        author: { name: 'Dev', email: 'dev@example.com' },
        contributors: [],
        status: 'valid' as const,
        ipfsCid: 'QmdoY1VUxVvxShBQK5B6PP2jZFVw7PMTJ3qy2aiCARjMqo',
      },
    ],
    policy: async (entityId: string): Promise<any[]> => [
      {
        packageName: entityId,
        version: '1.0.0',
        identity: `PolicyVersionDef|${entityId}@1.0.0`,
        changes: 'Initial release',
        description: 'Policy description',
        parameters: {
          uiSchema: '{"type":"object"}',
          jsonSchema: '{"type":"object"}',
        },
        repository: [`https://github.com/vincent/${entityId}`],
        keywords: ['policy'],
        dependencies: ['@vincent/sdk'],
        author: { name: 'Dev', email: 'dev@example.com' },
        contributors: [],
        status: 'valid' as const,
        ipfsCid: 'QmdoY1VUxVvxShBQK5B6PP2jZFVw7PMTJ3qy2aiCARjMqo',
      },
    ],
  },
  getVersion: {
    app: async (data: any): Promise<any> => ({
      appId: parseInt(data.appId),
      version: parseInt(data.version),
      identity: `AppVersionDef|${data.appId}@${data.version}`,
      tools: ['@vincent/tool-1@1.0.0'],
      changes: 'Version changes',
      createdAt: '2024-01-01T00:00:00Z',
      isActive: false,
    }),
    tool: async (data: any): Promise<any> => ({
      packageName: data.packageName,
      version: data.version,
      identity: `ToolVersionDef|${data.packageName}@${data.version}`,
      changes: 'Version changes',
      supportedPolicies: ['@vincent/policy-1'],
      repository: [`https://github.com/vincent/${data.packageName}`],
      keywords: ['tool'],
      dependencies: ['@vincent/sdk'],
      author: { name: 'Dev', email: 'dev@example.com' },
      contributors: [],
      status: 'valid' as const,
      ipfsCid: 'QmdoY1VUxVvxShBQK5B6PP2jZFVw7PMTJ3qy2aiCARjMqo',
    }),
    policy: async (data: any): Promise<any> => ({
      packageName: data.packageName,
      version: data.version,
      identity: `PolicyVersionDef|${data.packageName}@${data.version}`,
      changes: 'Version changes',
      description: 'Policy description',
      parameters: {
        uiSchema: '{"type":"object"}',
        jsonSchema: '{"type":"object"}',
      },
      repository: [`https://github.com/vincent/${data.packageName}`],
      keywords: ['policy'],
      dependencies: ['@vincent/sdk'],
      author: { name: 'Dev', email: 'dev@example.com' },
      contributors: [],
      status: 'valid' as const,
      ipfsCid: 'QmdoY1VUxVvxShBQK5B6PP2jZFVw7PMTJ3qy2aiCARjMqo',
    }),
  },
  editVersion: {
    app: async (data: any): Promise<any> => ({
      appId: parseInt(data.appId),
      version: parseInt(data.version),
      identity: `AppVersionDef|${data.appId}@${data.version}`,
      tools: ['@vincent/tool-1@1.0.0'],
      changes: data.changes,
      createdAt: '2024-01-01T00:00:00Z',
      isActive: false,
    }),
    tool: async (data: any): Promise<any> => ({
      packageName: data.packageName,
      version: data.version,
      identity: `ToolVersionDef|${data.packageName}@${data.version}`,
      changes: data.changes,
      supportedPolicies: ['@vincent/policy-1'],
      repository: [`https://github.com/vincent/${data.packageName}`],
      keywords: ['tool'],
      dependencies: ['@vincent/sdk'],
      author: { name: 'Dev', email: 'dev@example.com' },
      contributors: [],
      status: 'valid' as const,
      ipfsCid: 'QmdoY1VUxVvxShBQK5B6PP2jZFVw7PMTJ3qy2aiCARjMqo',
    }),
    policy: async (data: any): Promise<any> => ({
      packageName: data.packageName,
      version: data.version,
      identity: `PolicyVersionDef|${data.packageName}@${data.version}`,
      changes: data.changes,
      description: 'Policy description',
      parameters: {
        uiSchema: '{"type":"object"}',
        jsonSchema: '{"type":"object"}',
      },
      repository: [`https://github.com/vincent/${data.packageName}`],
      keywords: ['policy'],
      dependencies: ['@vincent/sdk'],
      author: { name: 'Dev', email: 'dev@example.com' },
      contributors: [],
      status: 'valid' as const,
      ipfsCid: 'QmdoY1VUxVvxShBQK5B6PP2jZFVw7PMTJ3qy2aiCARjMqo',
    }),
  },
  createVersion: {
    tool: async (data: any): Promise<any> => ({
      packageName: data.packageName,
      version: '1.0.0',
      identity: `ToolVersionDef|${data.packageName}@1.0.0`,
      changes: data.changes,
      supportedPolicies: ['@vincent/policy-1'],
      repository: [`https://github.com/vincent/${data.packageName}`],
      keywords: ['tool'],
      dependencies: ['@vincent/sdk'],
      author: { name: 'Dev', email: 'dev@example.com' },
      contributors: [],
      status: 'valid' as const,
      ipfsCid: 'QmdoY1VUxVvxShBQK5B6PP2jZFVw7PMTJ3qy2aiCARjMqo',
    }),
    policy: async (data: any): Promise<any> => ({
      packageName: data.packageName,
      version: '1.0.0',
      identity: `PolicyVersionDef|${data.packageName}@1.0.0`,
      changes: data.changes,
      description: 'Policy description',
      parameters: {
        uiSchema: '{"type":"object"}',
        jsonSchema: '{"type":"object"}',
      },
      repository: [`https://github.com/vincent/${data.packageName}`],
      keywords: ['policy'],
      dependencies: ['@vincent/sdk'],
      author: { name: 'Dev', email: 'dev@example.com' },
      contributors: [],
      status: 'valid' as const,
      ipfsCid: 'QmdoY1VUxVvxShBQK5B6PP2jZFVw7PMTJ3qy2aiCARjMqo',
    }),
  },
};
