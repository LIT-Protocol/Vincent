import { useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { RJSFSchema, UiSchema, createSchemaUtils } from '@rjsf/utils';
import Form from '@rjsf/shadcn';
import validator from '@rjsf/validator-ajv8';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { PolicyVersion } from '@/types/developer-dashboard/appTypes';

interface PolicyFormProps {
  policy: PolicyVersion;
  isDark: boolean;
  formData: Record<string, any>;
  onFormChange: (policyIpfsCid: string, data: any) => void;
}

export interface PolicyFormRef {
  validateForm: () => boolean;
}

export const PolicyForm = forwardRef<PolicyFormRef, PolicyFormProps>(
  ({ policy, isDark, formData, onFormChange }, ref) => {
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
            .policy-form-${policy.ipfsCid} * {
              color: ${isDark ? 'rgb(255 255 255 / 0.8)' : 'rgb(17 24 39)'} !important;
            }
            
            .policy-form-${policy.ipfsCid} label {
              color: ${isDark ? 'rgb(255 255 255 / 0.9)' : 'rgb(17 24 39)'};
              font-weight: 500;
              margin-bottom: 0.5rem;
              display: block;
            }
            
            .policy-form-${policy.ipfsCid} input,
            .policy-form-${policy.ipfsCid} textarea,
            .policy-form-${policy.ipfsCid} select {
              background-color: ${isDark ? 'rgb(255 255 255 / 0.05)' : 'rgb(249 250 251)'};
              border: 1px solid ${isDark ? 'rgb(255 255 255 / 0.1)' : 'rgb(209 213 219)'};
              color: ${isDark ? 'rgb(255 255 255 / 0.9)' : 'rgb(17 24 39)'};
              border-radius: 0.5rem;
              padding: 0.75rem;
              width: 100%;
              transition: all 0.2s ease;
            }
            
            .policy-form-${policy.ipfsCid} input:focus,
            .policy-form-${policy.ipfsCid} textarea:focus,
            .policy-form-${policy.ipfsCid} select:focus {
              outline: none;
              border-color: ${isDark ? 'rgb(255 255 255 / 0.3)' : 'rgb(59 130 246)'};
              box-shadow: 0 0 0 3px ${isDark ? 'rgb(255 255 255 / 0.1)' : 'rgb(59 130 246 / 0.1)'};
            }
            
            .policy-form-${policy.ipfsCid} input::placeholder,
            .policy-form-${policy.ipfsCid} textarea::placeholder {
              color: ${isDark ? 'rgb(255 255 255 / 0.4)' : 'rgb(107 114 128)'};
            }
            
            .policy-form-${policy.ipfsCid} .field-description {
              color: ${isDark ? 'rgb(255 255 255 / 0.6)' : 'rgb(107 114 128)'};
              font-size: 0.875rem;
              margin-top: 0.25rem;
            }
            
            .policy-form-${policy.ipfsCid} .field-error {
              color: ${isDark ? 'rgb(248 113 113)' : 'rgb(239 68 68)'};
              font-size: 0.875rem;
              margin-top: 0.25rem;
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
