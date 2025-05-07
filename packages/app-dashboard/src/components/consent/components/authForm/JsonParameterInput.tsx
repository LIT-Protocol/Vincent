import Form from '@rjsf/shadcn';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

interface JsonParameterInputProps {
  formData?: Record<string, any>;
  jsonSchema: RJSFSchema;
  uiSchema: UiSchema;
  handleSubmit: (data: any) => void;
  onChange?: (data: any) => void;
}

export default function JsonParameterInput({
  formData = {},
  jsonSchema,
  uiSchema,
  handleSubmit,
  onChange,
}: JsonParameterInputProps) {
  const enhancedUiSchema = { ...uiSchema };

  enhancedUiSchema['ui:classNames'] = 'rjsf-parameter-field';
  enhancedUiSchema['ui:submitButtonOptions'] = {
    submitText: 'Approve',
    props: {
      className: 'approve-button mt-4 border-t border-gray-200',
      style: {
        marginTop: '2rem',
      },
    },
  };

  return (
    <div className="parameter-input-container">
      <div className="parameter-input-body">
        <Form
          schema={jsonSchema}
          uiSchema={enhancedUiSchema}
          formData={formData}
          validator={validator}
          liveValidate={false}
          onSubmit={handleSubmit}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
