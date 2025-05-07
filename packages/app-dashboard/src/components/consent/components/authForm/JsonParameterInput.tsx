import Form from '@rjsf/core';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import './json-parameter-input.css';

interface JsonParameterInputProps {
  values?: Record<string, any>;
  jsonSchema: RJSFSchema;
  uiSchema: UiSchema;
  handleSubmit: (data: any) => void;
}

export default function JsonParameterInput({
  values = {},
  jsonSchema,
  uiSchema,
  handleSubmit,
}: JsonParameterInputProps) {
  const enhancedUiSchema = { ...uiSchema };

  enhancedUiSchema['ui:classNames'] = 'rjsf-parameter-field';

  return (
    <div className="parameter-input-container">
      <div className="parameter-input-body">
        <Form
          schema={jsonSchema}
          uiSchema={enhancedUiSchema}
          formData={values}
          validator={validator}
          liveValidate={true}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
