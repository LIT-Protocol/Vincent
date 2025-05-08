import { useCallback } from 'react';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import JsonParameterInput from './JsonParameterInput';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { decode, encode } from 'cbor2';

// Combined JSON schema for all parameters
const jsonSchema: RJSFSchema = {
  type: 'object',
  required: ['firstName', 'lastName'],
  properties: {
    firstName: {
      type: 'string',
      title: 'First name',
      default: 'Chuck',
    },
    lastName: {
      type: 'string',
      title: 'Last name',
    },
    age: {
      type: 'integer',
      title: 'Age',
    },
    bio: {
      type: 'string',
      title: 'Bio',
    },
    password: {
      type: 'string',
      title: 'Password',
      minLength: 3,
    },
    telephone: {
      type: 'string',
      title: 'Telephone',
      minLength: 10,
    },
  },
};

// Combined UI schema for all parameters
const uiSchema: UiSchema = {
  firstName: {
    'ui:autofocus': true,
    'ui:emptyValue': '',
    'ui:placeholder': 'ui:emptyValue causes this field to always be valid despite being required',
    'ui:autocomplete': 'family-name',
    'ui:enableMarkdownInDescription': true,
    'ui:description':
      'Make text **bold** or *italic*. Take a look at other options [here](https://markdown-to-jsx.quantizor.dev/).',
  },
  lastName: {
    'ui:autocomplete': 'given-name',
    'ui:enableMarkdownInDescription': true,
    'ui:description':
      'Make things **bold** or *italic*. Embed snippets of `code`. <small>And this is a small texts.</small> ',
  },
  age: {
    'ui:widget': 'updown',
    'ui:title': 'Age of person',
    'ui:description': '(earth year)',
  },
  bio: {
    'ui:widget': 'textarea',
  },
  password: {
    'ui:widget': 'password',
    'ui:help': 'Hint: Make it strong!',
  },
  telephone: {
    'ui:options': {
      inputType: 'tel',
    },
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
  const handleSubmit = useCallback((data: any) => {
    triggerConfetti();
    const encoded = encode(data.formData);
    console.log('Encoded data:', encoded);

    // Convert binary data to base64 for storage using modern Web APIs
    const base64Data = btoa(String.fromCharCode(...Array.from(encoded)));
    localStorage.setItem('encoded', base64Data);

    // Retrieve and decode
    const storedBase64 = localStorage.getItem('encoded');
    if (storedBase64) {
      const binaryData = Uint8Array.from(atob(storedBase64), (c) => c.charCodeAt(0));
      const decoded = decode(binaryData);
      console.log('Decoded data:', decoded);
    }
  }, []);

  let asValues: Record<string, any> = {};
  if (localStorage.getItem('encoded')) {
    try {
      const storedBase64 = localStorage.getItem('encoded')!;
      const binaryData = Uint8Array.from(atob(storedBase64), (c) => c.charCodeAt(0));
      asValues = decode(binaryData) as Record<string, any>;
    } catch (error) {
      console.error('Error decoding stored data:', error);
      localStorage.removeItem('encoded'); // Clear invalid data
    }
  }

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
        <JsonParameterInput
          jsonSchema={jsonSchema}
          uiSchema={uiSchema}
          handleSubmit={handleSubmit}
          formData={asValues}
        />
      </div>
    </div>
  );
}
