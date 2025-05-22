# JSON Schema Validation with Zod

This document describes a comprehensive Zod-based validation system for JSON Schema objects, designed with security and React JSON Schema Form (RJSF) compatibility in mind.

## Overview

The validation system provides a strict, secure way to validate JSON Schema definitions while preventing dangerous properties like `$ref` that could pose security risks. It's specifically designed for use with React JSON Schema Form (RJSF) applications.

## Architecture

### Core Components

#### 1. BasicTypes
```typescript
const BasicTypes = z.union([
  z.literal('string'),
  z.literal('number'), 
  z.literal('integer'),
  z.literal('boolean'),
  z.literal('array'),
  z.literal('object'),
]);
```
Defines the allowed primitive types in JSON Schema. Restricts to safe, well-understood data types.

#### 2. EnumValues
```typescript
const EnumValues = z.array(z.union([z.string(), z.number()]));
```
Validates enum arrays, allowing only string and number values (excluding potentially dangerous types like objects or functions).

#### 3. JsonSchemaField (Recursive Union)
```typescript
const JsonSchemaField: z.ZodType = z.lazy(() => 
  z.union([
    JsonSchemaPrimitiveField,
    z.array(z.lazy(() => JsonSchemaField))
  ])
);
```
A recursive type that allows either primitive schema objects or arrays of schema objects, enabling complex nested validation structures.

## Schema Properties

### String Validation
- `minLength`: Minimum string length
- `maxLength`: Maximum string length  
- `pattern`: Regex pattern validation
- `format`: String format specification (email, date, etc.)

### Numeric Validation
- `minimum`: Minimum numeric value
- `maximum`: Maximum numeric value

### Array Validation
- `items`: Schema for array items (can be object or array)
- `uniqueItems`: Ensures array items are unique
- `additionalItems`: Controls validation of extra array items
- `minItems`: Minimum array length
- `maxItems`: Maximum array length

### Object Validation
- `properties`: Object property schemas
- `required`: Required property names
- `additionalProperties`: Controls extra object properties
- `patternProperties`: Pattern-based property validation
- `dependencies`: Property dependencies

### Conditional Logic
- `allOf`: All schemas must match
- `oneOf`: Exactly one schema must match  
- `anyOf`: At least one schema must match
- `not`: Schema must not match
- `if`/`then`/`else`: Conditional schema logic

### Metadata
- `title`: Human-readable title
- `description`: Schema description
- `const`: Constant value constraint
- `examples`: Example values
- `default`: Default value

## Root Schema Structure

### PolicyJsonSchema
```typescript
export const PolicyJsonSchema = z.object({
  type: z.literal('object'),           // Must be object type
  properties: z.record(JsonSchemaField), // Property definitions
  required: z.array(z.string()).optional(), // Required properties
  title: z.string().optional(),        // Schema title
  description: z.string().optional(),  // Schema description  
  definitions: z.record(z.any()).optional(), // Schema definitions
}).strict();
```

Root-level schema that enforces object type and contains all property definitions. Uses `.strict()` to reject any properties not explicitly defined in the schema.

### PolicyUiSchema
```typescript
export const PolicyUiSchema: PolicyUiSchemaType = z.record(PolicyUiSchemaInner);
```

Validates RJSF UI schema objects with specific rules:
- Keys must start with `ui:` (RJSF convention) or be standard keys like `classNames`
- Allows nested UI schema structures
- Provides flexible validation for UI customization

### PolicyDefinition  
```typescript
export const PolicyDefinition = z.object({
  jsonSchema: PolicyJsonSchema,
  uiSchema: PolicyUiSchema,
});
```

Complete policy definition combining both JSON schema and UI schema.

## Security Features

### Strict Validation
- Uses `.strict()` to reject any unrecognized properties
- Prevents injection of dangerous properties like `$ref`, `$id`, `$schema`
- Blocks prototype pollution attempts

### Allowed Properties Only
- Explicitly defines every allowed JSON Schema property
- Rejects any property not in the whitelist
- Recursive validation ensures nested objects are also secure

### Safe Types
- Restricts enum values to strings and numbers only
- Uses lazy evaluation for recursive schemas without infinite loops
- Validates UI schema keys follow RJSF conventions

## Usage Example

```typescript
import { PolicyDefinition } from './schema-validation';

const policyData = {
  jsonSchema: {
    type: 'object',
    title: 'User Profile',
    properties: {
      name: {
        type: 'string',
        title: 'Full Name',
        minLength: 1
      },
      age: {
        type: 'integer',
        minimum: 0,
        maximum: 150
      }
    },
    required: ['name']
  },
  uiSchema: {
    name: {
      'ui:placeholder': 'Enter your full name'
    },
    age: {
      'ui:widget': 'range'
    }
  }
};