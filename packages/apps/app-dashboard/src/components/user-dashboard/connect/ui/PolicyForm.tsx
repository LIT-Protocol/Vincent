import { useMemo, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { RJSFSchema, UiSchema, createSchemaUtils } from '@rjsf/utils';
import Form from '@rjsf/shadcn';
import validator from '@rjsf/validator-ajv8';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { PolicyVersion } from '@/types/developer-dashboard/appTypes';

interface PolicyFormProps {
  policy: PolicyVersion;
  formData: Record<string, any>;
  onFormChange: (policyIpfsCid: string, data: any) => void;
}

export interface PolicyFormRef {
  validateForm: () => boolean;
}

export const PolicyForm = forwardRef<PolicyFormRef, PolicyFormProps>(
  ({ policy, formData, onFormChange }, ref) => {
    const formRef = useRef<any>(null);

    const resolvedSchema = useMemo(() => {
      if (!policy.parameters?.jsonSchema || !policy.parameters?.uiSchema) {
        return null;
      }

      try {
        const jsonSchema = JSON.parse(policy.parameters.jsonSchema) as RJSFSchema;
        const uiSchema = JSON.parse(policy.parameters.uiSchema) as UiSchema;

        // Create AJV instance for validation
        const ajv = new Ajv({
          strictTypes: false,
        });
        addFormats(ajv);

        // Compile and validate schema
        ajv.compile(jsonSchema);

        // Use createSchemaUtils to properly resolve the schema
        const schemaUtils = createSchemaUtils(validator, jsonSchema);
        const resolvedJsonSchema = schemaUtils.retrieveSchema(jsonSchema);

        return {
          jsonSchema: resolvedJsonSchema,
          uiSchema,
        };
      } catch (error) {
        console.error('Error resolving schema for policy:', policy.ipfsCid, error);
        return null;
      }
    }, [policy.parameters?.jsonSchema, policy.parameters?.uiSchema, policy.ipfsCid]);

    // Initialize form with undefined values for all fields
    useEffect(() => {
      if (
        resolvedSchema?.jsonSchema?.properties &&
        Object.keys(formData[policy.ipfsCid] || {}).length === 0
      ) {
        const initialData: Record<string, any> = {};
        Object.keys(resolvedSchema.jsonSchema.properties).forEach((fieldName) => {
          initialData[fieldName] = undefined;
        });

        // Call onFormChange to set the initial structure
        onFormChange(policy.ipfsCid, { formData: initialData });
      }
    }, [resolvedSchema, policy.ipfsCid, formData, onFormChange]);

    useImperativeHandle(ref, () => ({
      validateForm: () => {
        if (formRef.current) {
          return formRef.current.validateForm();
        }
        return true; // If no form, consider it valid
      },
    }));

    if (!resolvedSchema) {
      return null;
    }

    return (
      <div className="mt-4 p-4 bg-opacity-50 rounded-lg border border-opacity-20">
        <style>
          {`
            .policy-form-${policy.ipfsCid} {
              color: rgb(17 24 39) !important;
            }
            
            .dark .policy-form-${policy.ipfsCid} {
              color: rgb(255 255 255 / 0.8) !important;
            }
            
            .policy-form-${policy.ipfsCid} label {
              color: inherit !important;
              font-weight: 400;
              font-size: 0.75rem;
              margin-bottom: 0.25rem;
              display: block;
            }
            
            .policy-form-${policy.ipfsCid} input,
            .policy-form-${policy.ipfsCid} textarea,
            .policy-form-${policy.ipfsCid} select {
              background-color: rgb(249 250 251);
              border: 1px solid rgb(209 213 219);
              color: rgb(17 24 39);
              border-radius: 0.5rem;
              padding: 0.5rem;
              width: 100%;
              font-size: 0.75rem;
              transition: all 0.2s ease;
            }
            
            .dark .policy-form-${policy.ipfsCid} input,
            .dark .policy-form-${policy.ipfsCid} textarea,
            .dark .policy-form-${policy.ipfsCid} select {
              background-color: rgb(255 255 255 / 0.05);
              border: 1px solid rgb(255 255 255 / 0.1);
              color: rgb(255 255 255 / 0.9);
            }
            
            .policy-form-${policy.ipfsCid} input:focus,
            .policy-form-${policy.ipfsCid} textarea:focus,
            .policy-form-${policy.ipfsCid} select:focus {
              outline: none;
              border-color: rgb(59 130 246);
              box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
            }
            
            .dark .policy-form-${policy.ipfsCid} input:focus,
            .dark .policy-form-${policy.ipfsCid} textarea:focus,
            .dark .policy-form-${policy.ipfsCid} select:focus {
              border-color: rgb(255 255 255 / 0.3);
              box-shadow: 0 0 0 3px rgb(255 255 255 / 0.1);
            }
            
            .policy-form-${policy.ipfsCid} input::placeholder,
            .policy-form-${policy.ipfsCid} textarea::placeholder {
              color: rgb(107 114 128);
            }
            
            .dark .policy-form-${policy.ipfsCid} input::placeholder,
            .dark .policy-form-${policy.ipfsCid} textarea::placeholder {
              color: rgb(255 255 255 / 0.4);
            }
            
            .policy-form-${policy.ipfsCid} * {
              font-size: 0.625rem !important;
            }
            
            .policy-form-${policy.ipfsCid} label {
              font-size: 0.75rem !important;
            }
            
            .policy-form-${policy.ipfsCid} input,
            .policy-form-${policy.ipfsCid} textarea,
            .policy-form-${policy.ipfsCid} select {
              font-size: 0.75rem !important;
            }
            
            .policy-form-${policy.ipfsCid} .field-description,
            .policy-form-${policy.ipfsCid} .form-text,
            .policy-form-${policy.ipfsCid} .help-text,
            .policy-form-${policy.ipfsCid} .description,
            .policy-form-${policy.ipfsCid} .field-help,
            .policy-form-${policy.ipfsCid} small,
            .policy-form-${policy.ipfsCid} .text-muted,
            .policy-form-${policy.ipfsCid} p {
              opacity: 0.7 !important;
              font-size: 0.625rem !important;
            }
            
            .policy-form-${policy.ipfsCid} .field-error,
            .policy-form-${policy.ipfsCid} .text-danger,
            .policy-form-${policy.ipfsCid} .invalid-feedback,
            .policy-form-${policy.ipfsCid} .form-text.text-danger,
            .policy-form-${policy.ipfsCid} .text-red-500,
            .policy-form-${policy.ipfsCid} .error-detail,
            .policy-form-${policy.ipfsCid} [role="alert"],
            .policy-form-${policy.ipfsCid} .text-destructive {
              color: rgb(239 68 68) !important;
              font-size: 0.875rem;
              margin-top: 0.25rem;
            }
            
            .dark .policy-form-${policy.ipfsCid} .field-error,
            .dark .policy-form-${policy.ipfsCid} .text-danger,
            .dark .policy-form-${policy.ipfsCid} .invalid-feedback,
            .dark .policy-form-${policy.ipfsCid} .form-text.text-danger,
            .dark .policy-form-${policy.ipfsCid} .text-red-500,
            .dark .policy-form-${policy.ipfsCid} .error-detail,
            .dark .policy-form-${policy.ipfsCid} [role="alert"],
            .dark .policy-form-${policy.ipfsCid} .text-destructive {
              color: rgb(248 113 113) !important;
            }
            
            .policy-form-${policy.ipfsCid} button[type="submit"] {
              display: none;
            }
          `}
        </style>
        <div className={`policy-form-${policy.ipfsCid}`}>
          <Form
            ref={formRef}
            schema={resolvedSchema.jsonSchema}
            uiSchema={resolvedSchema.uiSchema}
            formData={formData[policy.ipfsCid] || {}}
            validator={validator}
            liveValidate={false}
            showErrorList={false}
            onChange={(data) => onFormChange(policy.ipfsCid, data)}
          />
        </div>
      </div>
    );
  },
);
