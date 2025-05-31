# Vincent API Mock Forms

**Modular, type-safe form system for testing Vincent API endpoints with consolidated Zod validation and universal entity forms.**

## 🏗️ Architecture

- **🔗 Unique Forms**: Complex blockchain operations requiring custom logic (`unique/`)
- **🔄 Generic System**: Universal CRUD forms for all entity types (`generic/`)
- **📦 Modular Components**: Single-responsibility files with proper separation of concerns

## 🎯 Form Categories

### 1. **Unique Forms** (Custom Implementations)
Specialized forms for complex operations requiring custom logic:

#### App Management (Blockchain)
- **`CreateAppForm`** - Create new blockchain app with logo validation, redirect URIs, deployment status, and entity selection
- **`DeleteAppForm`** - Permanently delete blockchain app with confirmation  
- **`CreateAppVersionForm`** - Create new app version on blockchain with entity selection

### 2. **Generic Forms** (Universal Implementations)
All other forms use the universal `GenericEntityForm` that adapts to different entity types:

#### App Operations
- `GetAppForm`, `EditAppForm`, `GetAppVersionsForm`, `GetAppVersionForm`, `EditAppVersionForm`

#### Tool Management  
- `CreateToolForm`, `GetToolForm`, `EditToolForm`, `ChangeToolOwnerForm`, `GetAllToolsForm`
- `GetToolVersionsForm`, `CreateToolVersionForm`, `GetToolVersionForm`, `EditToolVersionForm`

#### Policy Management
- `CreatePolicyForm`, `GetPolicyForm`, `EditPolicyForm`, `ChangePolicyOwnerForm`, `GetAllPoliciesForm`  
- `GetPolicyVersionsForm`, `CreatePolicyVersionForm`, `GetPolicyVersionForm`, `EditPolicyVersionForm`

## 🧩 Core Components

### **types.ts** ✨
```tsx
export type EntityType = 'app' | 'tool' | 'policy';
export type EntityDataShape<T extends EntityType> = // Complete type definitions
export interface ValidationRule<T = any> // Form validation types
```

### **validation.ts** ✨
```tsx
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  // ... centralized messages
};

export const schemas = {
  required: (message?: string) => z.string().min(1, message || VALIDATION_MESSAGES.REQUIRED),
  email: (message?: string) => z.string().email(message || VALIDATION_MESSAGES.INVALID_EMAIL),
  appId: (message?: string) => z.string().regex(/^\d+$/, message || VALIDATION_MESSAGES.INVALID_APP_ID),
  packageName: (message?: string) => z.string().regex(/^@[a-z0-9-]+\/[a-z0-9-]+$/),
  arrayOfStrings: (message?: string) => z.array(z.string().min(1)).min(1),
  // ... comprehensive Zod schema library
};

export const validateWithSchema = (schema: z.ZodSchema, value: any): string | undefined
```

### **entityConfigs.ts** ✨
```tsx
export const ENTITY_OPERATIONS = {
  app: { get: true, update: true, delete: true, create: false, /* ... */ },
  tool: { get: true, update: true, delete: false, create: true, /* ... */ },
  policy: { get: true, update: true, delete: false, create: true, /* ... */ }
};

export const ENTITY_CONFIGS = {
  app: {
    name: 'app', displayName: 'Application', idLabel: 'App ID',
    idSchema: schemas.appId(), operations: ENTITY_OPERATIONS.app,
    fields: { identifier: 'appId', identifierType: 'number' as const }
  },
  // ... tool and policy configs with Zod schemas
};

export const validateEntityId = (entityType: EntityType, value: string): string | undefined
```

### **FormHooks.tsx** ✨
```tsx
export function useForm<T>(initialValues: T, validationRules?: Partial<Record<keyof T, ValidationRule<T[keyof T]> | z.ZodSchema<T[keyof T]>>>) {
  // Form state management with Zod integration
  return { values, errors, touched, setValue, validateAll, isValid, /* ... */ };
}

export function useAsyncForm<TRequest, TResponse>(submitFn: (data: TRequest) => Promise<TResponse>) {
  // Async form submission with loading states
  return { submit, isLoading, result, error, clearResult };
}
```

### **EntityForms.tsx** ✨
```tsx
export function GenericEntityForm<T>({ entityType, operation }: { entityType: EntityType; operation: keyof typeof ENTITY_CONFIGS[EntityType]['operations'] }) {
  // Universal form that adapts to any entity type/operation through configuration
  // Handles all CRUD operations for apps, tools, policies
}
```

## 🎯 Form System

### Universal Forms (95% of forms)
All standard CRUD operations use `GenericEntityForm`:
```tsx
// All entities use same pattern - configured by type:
export const GetAppForm = () => <GenericEntityForm entityType="app" operation="get" />;
export const GetToolForm = () => <GenericEntityForm entityType="tool" operation="get" />;
export const GetPolicyForm = () => <GenericEntityForm entityType="policy" operation="get" />;
```

### Unique Forms (Complex operations)
- **CreateAppForm** - Blockchain app creation with logo, URIs, deployment, entity selection
- **DeleteAppForm** - App deletion with confirmation
- **CreateAppVersionForm** - Blockchain versioning with entity selection

## 📁 Directory Structure

```
mock-forms/
├── README.md                          # Documentation
├── index.ts                           # Main exports  
├── MockApiFormsContainer.tsx          # Tabbed interface
│
├── unique/                            # Custom implementations
│   ├── CreateAppForm.tsx             # Blockchain app creation
│   ├── DeleteAppForm.tsx             # Blockchain app deletion
│   ├── CreateAppVersionForm.tsx      # Blockchain app versioning
│   └── index.ts                      # Exports
│
└── generic/                          # Universal system
    ├── types.ts                      # 🆕 Entity types, data shapes
    ├── validation.ts                 # 🆕 Zod schemas, messages, helpers
    ├── entityConfigs.ts              # 🆕 Entity configs, operations
    ├── FormHooks.tsx                 # 🆕 Form hooks only (useForm, useAsyncForm)
    ├── EntityForms.tsx               # Universal CRUD forms
    ├── EntitySelector.tsx            # Advanced entity selection
    ├── mockDataService.ts            # Comprehensive mock API
    ├── BaseForm.tsx                  # Form wrapper
    ├── FormField.tsx                 # Field components
    ├── ApiResponseDisplay.tsx        # Result display
    └── index.tsx                     # Form exports
```

## 🔧 Key Features

- **✅ Modular Architecture**: Single-responsibility files with clear separation of concerns
- **✅ Zod Validation**: Type-safe validation with centralized schemas and error messages
- **✅ Universal Entity System**: One implementation works for all entity types through configuration
- **✅ Type Safety**: Full TypeScript support with compile-time and runtime validation
- **✅ Form Validation**: Proper form enablement only when all required fields are complete
- **✅ Mock API Service**: Comprehensive testing with realistic async patterns

## 🚀 Usage

### Basic Form
```tsx
const form = useForm(
  { name: '', email: '' },
  { 
    name: schemas.minLength(3),
    email: schemas.email()
  }
);
```

### Entity Operations
```tsx
// Get any entity - auto-adapts to entity type
<GenericEntityForm entityType="app" operation="get" />
<GenericEntityForm entityType="tool" operation="create" />
<GenericEntityForm entityType="policy" operation="update" />
```

### Integration
Replace `EntityAPIService` methods in `mockDataService.ts` with real API calls to go live.

---

**Architecture Benefits**: Modular design enables easy maintenance, testing, and extension while maintaining type safety and consistent validation patterns across all forms. 