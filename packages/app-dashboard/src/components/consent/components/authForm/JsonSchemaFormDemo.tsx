import { useCallback } from 'react';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import JsonParameterInput from './JsonParameterInput';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Combined JSON schema for all parameters
const jsonSchema: RJSFSchema = {
  type: 'object',
  properties: {
    userInfo: {
      type: 'string',
      title: 'User Information',
      description: 'Enter user information',
    },
    tokenAmount: {
      type: 'integer',
      title: 'Token Amount',
      minimum: 0,
    },
    consent: {
      type: 'boolean',
      title: 'Terms Consent',
      default: false,
    },
  },
};

// Combined UI schema for all parameters
const uiSchema: UiSchema = {
  userInfo: {
    'ui:widget': 'textarea',
    'ui:placeholder': 'Enter your information',
    'ui:help': 'Enter your user information',
  },
  tokenAmount: {
    'ui:widget': 'updown',
    'ui:placeholder': 'Enter token amount',
    'ui:help': 'Specify the amount of tokens',
  },
  consent: {
    'ui:widget': 'checkbox',
    'ui:help': 'Please agree to our terms and conditions',
  },
};

const triggerConfetti = () => {
  import('canvas-confetti').then((confetti) => {
    confetti.default({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
    });
  });
};

export default function JsonSchemaFormDemo() {
  const handleApprove = useCallback(() => {
    triggerConfetti();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">JSON Schema Form Demo</h1>

      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Form with JSON Schema</h2>

        <JsonParameterInput
          jsonSchema={jsonSchema}
          uiSchema={uiSchema}
          handleSubmit={handleApprove}
        />
      </div>
    </div>
  );
}
