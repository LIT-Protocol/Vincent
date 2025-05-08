import { useNavigate } from 'react-router';
import { useState, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { ArrowLeft, Info, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusMessage } from '@/utils/statusMessage';
import { VincentContracts } from '@/services';
import { Network } from '@/services';
import { mapTypeToEnum } from '@/services/types';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import Form from '@rjsf/shadcn';
import { Input } from '@/components/ui/input';

interface CreateAppScreenProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

const DEFAULT_TOOLS = [
  {
    name: 'Weather API Tool',
    toolIpfsCid: 'QmUT4Ke8cPtJYRZiWrkoG9RZc77hmRETNQjvDYfLtrMUEY',
    policies: [
      {
        policyIpfsCid: 'weatherPolicy1',
        parameters: [
          { name: 'location', type: 'string' },
          { name: 'units', type: 'string' },
        ],
      },
    ],
  },
  {
    name: 'Document Processing Tool',
    toolIpfsCid: 'QmWHAQiA2HzJKqemYxUQE6WW55ZqVX4542ZUPTCjoAsPFJ',
    policies: [
      {
        policyIpfsCid: 'docPolicy1',
        parameters: [
          { name: 'format', type: 'string' },
          { name: 'maxSize', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'Payment Processing Tool',
    toolIpfsCid: 'QmT7fAT9CXEYMrttS9LcuiMjEK3gfQEsLY6pZ4kWKTuUcc',
    policies: [
      {
        policyIpfsCid: 'paymentPolicy1',
        parameters: [
          { name: 'amount', type: 'uint256' },
          { name: 'recipient', type: 'address' },
        ],
      },
    ],
  },
];

const schema: RJSFSchema = {
  type: 'object',
  required: [
    'appName',
    'description',
    'authorizedRedirectUris',
    'selectedTools',
    'deploymentStatus',
  ],
  properties: {
    appName: {
      type: 'string',
      title: 'Application Name',
      minLength: 2,
      maxLength: 50,
    },
    description: {
      type: 'string',
      title: 'Description',
      minLength: 10,
      maxLength: 500,
    },
    authorizedRedirectUris: {
      type: 'array',
      title: 'Authorized Redirect URIs',
      items: {
        type: 'string',
        format: 'uri',
      },
      minItems: 1,
    },
    deploymentStatus: {
      type: 'string',
      title: 'Deployment Status',
      enum: ['dev', 'test', 'prod'],
      oneOf: [
        { const: 'dev', title: 'DEV' },
        { const: 'test', title: 'TEST' },
        { const: 'prod', title: 'PROD' },
      ],
      default: 'dev',
    },
    selectedTools: {
      type: 'array',
      title: 'Selected Tools',
      items: {
        type: 'string',
      },
      minItems: 1,
      uniqueItems: true,
    },
  },
};

// UI Schema for customizing form appearance
const uiSchema: UiSchema = {
  appName: {
    'ui:autofocus': true,
    'ui:placeholder': 'My Vincent App',
    'ui:help': 'Name that users will see in the registry',
  },
  description: {
    'ui:widget': 'textarea',
    'ui:placeholder': 'Describe your application...',
    'ui:help': 'Describe what your app does (supports Markdown)',
    'ui:options': {
      rows: 6,
    },
  },
  authorizedRedirectUris: {
    'ui:help': 'URLs your app is allowed to redirect to with JWT authentication',
    items: {
      'ui:placeholder': 'https://example.com/callback',
    },
  },
  deploymentStatus: {
    'ui:widget': 'radio',
    'ui:help': 'Current deployment status of your app',
  },
  selectedTools: {
    'ui:help': 'Select tools for your application',
    'ui:widget': 'CheckboxesWidget',
  },
};

// Default form data
const defaultFormData = {
  appName: '',
  description: '',
  authorizedRedirectUris: [''],
  deploymentStatus: 'dev',
  selectedTools: [],
};

// Custom Tools Widget component
const ToolsWidget = ({ value = [], onChange }: any) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTools = DEFAULT_TOOLS.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.toolIpfsCid.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToolToggle = (toolIpfsCid: string) => {
    if (value.includes(toolIpfsCid)) {
      onChange(value.filter((id: string) => id !== toolIpfsCid));
    } else {
      onChange([...value, toolIpfsCid]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          type="text"
          placeholder="Search for tools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
        {filteredTools.length === 0 ? (
          <p className="text-sm text-gray-500 p-2">No tools match your search</p>
        ) : (
          filteredTools.map((tool) => (
            <div key={tool.toolIpfsCid} className="flex items-start p-2 border rounded-md">
              <input
                type="checkbox"
                id={`tool-${tool.toolIpfsCid}`}
                checked={value.includes(tool.toolIpfsCid)}
                onChange={() => handleToolToggle(tool.toolIpfsCid)}
                className="mt-1 mr-2"
              />
              <label htmlFor={`tool-${tool.toolIpfsCid}`} className="flex-1">
                <div className="font-medium">{tool.name}</div>
                <div className="text-xs text-gray-500 truncate">{tool.toolIpfsCid}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {tool.policies.length} {tool.policies.length === 1 ? 'policy' : 'policies'} with{' '}
                  {tool.policies.reduce((acc, policy) => acc + policy.parameters.length, 0)}{' '}
                  parameters
                </div>
              </label>
            </div>
          ))
        )}
      </div>

      {value.length > 0 && (
        <div className="text-sm text-blue-600">
          {value.length} tool{value.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
};

// Define custom widgets
const widgets = {
  CheckboxesWidget: ToolsWidget,
};

export default function CreateAppScreen({ onBack, onSuccess }: CreateAppScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
  } | null>(null);

  const { address } = useAccount();
  const chainId = useChainId();
  const navigate = useNavigate();

  // Form submission handler
  const handleSubmit = useCallback(
    async (data: any) => {
      if (!address || !chainId) {
        setStatusMessage({
          message: 'Wallet not connected. Please connect your wallet.',
          type: 'error',
        });
        return;
      }

      try {
        setIsSubmitting(true);
        setStatusMessage({ message: 'Creating application...', type: 'info' });

        const formData = data.formData;

        console.log(formData);

        /* Commenting out app registration while the contracts are WIP
      const contracts = new VincentContracts('datil' as Network);
      const receipt = await contracts
        .registerApp(
          formData.appName,
          formData.description,
          formData.authorizedRedirectUris,
          [],
          toolIpfsCids,
          toolPolicies,
          toolPolicyParameterTypes,
          toolPolicyParameterNames,
          deploymentStatusValue,
        )
        .catch((err) => {
          console.error('Transaction rejected:', err);
          setStatusMessage({
            message: err.message && err.message.includes('user rejected')
              ? 'Transaction was rejected'
              : 'Failed to create app - rejected the transaction',
            type: 'error'
          });
          return null;
        });


      if (!receipt) return;
      */

        // Show success message and navigate
        setStatusMessage({
          message: 'Application created successfully!',
          type: 'success',
        });

        // Force redirect after a short delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            navigate('/');
          }
        }, 1500);
      } catch (err) {
        console.error('Error submitting form:', err);
        setStatusMessage({
          message: err instanceof Error ? err.message : 'Failed to create app',
          type: 'error',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [address, chainId, navigate, onSuccess],
  );

  return (
    <div className="space-y-8">
      {statusMessage && <StatusMessage message={statusMessage.message} type={statusMessage.type} />}

      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        <h1 className="text-3xl font-bold text-black">Create New App</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span>Register New Vincent App</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 px-2 py-0"
              title="Fill out this form to register your application to the Vincent registry."
            >
              <Info className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription className="text-black">
            Submit your application to the Vincent registry
            <div className="mt-2 text-sm">
              App Manager Address: <code className="text-black">{address}</code>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            schema={schema}
            uiSchema={uiSchema}
            validator={validator}
            formData={defaultFormData}
            onSubmit={handleSubmit}
            disabled={isSubmitting}
            widgets={widgets}
          >
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6 mt-4">
              <p className="font-medium">Important Notes:</p>
              <ul className="list-disc ml-5 text-sm">
                <li>Select at least one tool for your application</li>
                <li>Each tool comes with predefined policies and parameters</li>
                <li>You can search for tools by name or CID</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              {onBack && (
                <Button type="button" variant="outline" onClick={onBack}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Application'}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
