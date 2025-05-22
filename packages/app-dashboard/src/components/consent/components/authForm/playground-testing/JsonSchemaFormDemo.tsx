import { useCallback, useMemo } from 'react';
import { RJSFSchema, UiSchema, createSchemaUtils } from '@rjsf/utils';
import JsonParameterInput from './JsonParameterInput';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { decode, encode } from 'cbor2';
import Ajv from 'ajv';
import secureSchema from 'ajv/lib/refs/json-schema-secure.json';
import addFormats from 'ajv-formats';
import validator from '@rjsf/validator-ajv8';
import { z } from 'zod';
import { ExpandableCard } from './ExpandableCard';
import * as simpleSchema from './simple';
import * as nestedSchema from './nested';
import { PolicyDefinition } from './zod-validation';

type Schema = {
  policy: z.infer<typeof PolicyDefinition>;
  id: string;
  title: string;
  formData?: Record<string, any>;
};

type ValidationResult<T> = { success: true; data: T } | { success: false; errors: string[] };

/**
 * Validates and merges multiple policy definitions.
 * Returns success with data or failure with error messages.
 */
function mergePolicies(schemas: Schema[]): ValidationResult<{
  jsonSchema: RJSFSchema;
  uiSchema: UiSchema;
  formData: Record<string, any>;
}> {
  if (!schemas.length) {
    return { success: false, errors: ['No schemas provided'] };
  }

  const ajv = new Ajv({
    strictTypes: false,
  });
  addFormats(ajv);
  const isSchemaSecure = ajv.compile(secureSchema);

  const validSchemas: Schema[] = [];
  const errors: string[] = [];

  // Filter and validate schemas
  for (const schema of schemas) {
    try {
      // Security check
      if (!isSchemaSecure(schema.policy.jsonSchema)) {
        errors.push(`Schema '${schema.title}' contains insecure properties`);
        continue;
      }

      // Compilation check
      ajv.compile(schema.policy.jsonSchema);
      validSchemas.push(schema);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid schema';
      errors.push(`Schema '${schema.title}': ${message}`);
    }
  }

  // Must have at least one valid schema
  if (validSchemas.length === 0) {
    return {
      success: false,
      errors: errors.length > 0 ? errors : ['All schemas failed validation'],
    };
  }

  // Build combined schema
  const combinedJsonSchema: RJSFSchema = {
    type: 'object',
    properties: {},
    required: [],
    definitions: {},
  };

  const combinedUiSchema: UiSchema = {};
  const combinedFormData: Record<string, any> = {};

  for (const schema of validSchemas) {
    const { policy, id, title, formData } = schema;
    const { properties, required, definitions, ...otherSchemaFields } = policy.jsonSchema as any;

    combinedJsonSchema.properties![id] = {
      ...otherSchemaFields,
      properties,
      title,
      ...(required?.length ? { required } : {}),
    };

    if (required?.length) {
      combinedJsonSchema.required!.push(id);
    }

    if (definitions) {
      Object.assign(combinedJsonSchema.definitions!, definitions);
    }

    combinedUiSchema[id] = {
      'ui:field': 'ExpandableCard',
      'ui:title': false,
      ...policy.uiSchema,
    };

    if (formData) {
      combinedFormData[id] = formData;
    }
  }

  // Resolve references and final validation
  try {
    const schemaUtils = createSchemaUtils(validator, combinedJsonSchema);
    const resolvedSchema = schemaUtils.retrieveSchema(combinedJsonSchema);
    ajv.compile(resolvedSchema);

    return {
      success: true,
      data: {
        jsonSchema: resolvedSchema,
        uiSchema: combinedUiSchema,
        formData: combinedFormData,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Schema resolution failed';
    return { success: false, errors: [`Failed to merge schemas: ${message}`] };
  }
}

// Example schemas setup
const exampleSchemas: Schema[] = [];
let validationError = false;

try {
  exampleSchemas.push({
    policy: PolicyDefinition.parse({
      jsonSchema: simpleSchema.jsonSchema,
      uiSchema: simpleSchema.uiSchema || {},
    }),
    id: 'QmR76vUGsEcPJNDraqEg3KhfZTibou6wMJW8LHZHMU5TFz',
    title: 'Personal Information Bot Policies',
    formData: simpleSchema.formData,
  });
} catch (error) {
  console.error('Error parsing simple schema:', error);
  validationError = true;
}

try {
  exampleSchemas.push({
    policy: PolicyDefinition.parse({
      jsonSchema: nestedSchema.jsonSchema,
      uiSchema: nestedSchema.uiSchema || {},
    }),
    id: 'QmdoY1VUxVvxShBQK5B6PP2jZFVw7PMTJ3qy2aiCARjMqo',
    title: 'Task Manager Bot Policies',
    formData: nestedSchema.formData,
  });
} catch (error) {
  console.error('Error parsing nested schema:', error);
  validationError = true;
}

try {
  exampleSchemas.push({
    policy: PolicyDefinition.parse({
      jsonSchema: {
        type: 'object',
        properties: {},
      },
      uiSchema: {},
    }),
    id: 'QmEmpty123456789123456789123456789123456789ABCDE',
    title: 'Empty Policy',
    formData: {},
  });
} catch (error) {
  console.error('Error parsing empty schema:', error);
  validationError = true;
}

if (validationError) {
  exampleSchemas.length = 0;
}

const triggerConfetti = () => {
  import('canvas-confetti').then((confetti) => {
    confetti.default({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
    });
  });
};

const fields = { ExpandableCard };

export default function JsonSchemaFormDemo() {
  const mergeResult = useMemo(() => mergePolicies(exampleSchemas), []);

  const handleSubmit = useCallback((data: any) => {
    triggerConfetti();
    const encoded = encode(data.formData);
    console.log('Encoded data:', encoded);

    const base64Data = btoa(String.fromCharCode(...Array.from(encoded)));

    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const decoded = decode(binaryData);
    console.log('Decoded data:', decoded);
  }, []);

  // Common header component
  const Header = () => (
    <>
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">JSON Schema Form Demo</h1>
    </>
  );

  // If validation failed, show error message
  if (!mergeResult.success) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Header />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Validation Failed</h2>
          <ul className="text-red-700 text-sm space-y-1">
            {mergeResult.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // If validation succeeded, show the form
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Header />
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <JsonParameterInput
          jsonSchema={mergeResult.data.jsonSchema}
          uiSchema={mergeResult.data.uiSchema}
          handleSubmit={handleSubmit}
          formData={mergeResult.data.formData}
          fields={fields}
        />
      </div>
    </div>
  );
}
