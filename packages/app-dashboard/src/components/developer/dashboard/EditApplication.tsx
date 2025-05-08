import { useCallback, useState } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusMessage } from '@/utils/statusMessage';
import { IAppDef } from '@/api/app/types';
import editApp from '@/api/app/edit';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import Form from '@rjsf/shadcn';

interface EditApplicationProps {
  app: IAppDef;
  onBack?: () => void;
  onSuccess?: () => void;
}

const jsonSchema: RJSFSchema = {
  type: 'object',
  required: [
    'name',
    'description',
    'contactEmail',
    'appUserUrl',
    'redirectUrls',
    'deploymentStatus',
  ],
  properties: {
    name: {
      type: 'string',
      title: 'App Name',
      minLength: 2,
      maxLength: 50,
    },
    description: {
      type: 'string',
      title: 'Description',
      minLength: 10,
      maxLength: 500,
    },
    contactEmail: {
      type: 'string',
      title: 'Contact Email',
      format: 'email',
    },
    appUserUrl: {
      type: 'string',
      title: 'App URL',
      format: 'uri',
    },
    logo: {
      type: 'string',
      title: 'Logo URL (optional)',
      format: 'uri',
    },
    redirectUrls: {
      type: 'array',
      title: 'Redirect URLs',
      items: {
        type: 'string',
        format: 'uri',
      },
      minItems: 1,
    },
    activeVersion: {
      type: 'integer',
      title: 'Active Version',
      minimum: 1,
      default: 1,
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
    },
  },
};

const uiSchema: UiSchema = {
  name: {
    'ui:autofocus': true,
    'ui:placeholder': 'Enter your app name',
    'ui:help': 'Name that users will see in the registry',
  },
  description: {
    'ui:widget': 'textarea',
    'ui:placeholder': 'Enter a description for your app',
    'ui:help': 'Describe what your app does (supports Markdown)',
  },
  contactEmail: {
    'ui:placeholder': 'contact@example.com',
    'ui:help': 'Email for users or support to reach you',
  },
  appUserUrl: {
    'ui:placeholder': 'https://your-app.example.com',
    'ui:help': 'URL where users access your app',
  },
  logo: {
    'ui:placeholder': 'https://your-app.example.com/logo.png',
    'ui:help': 'URL to your app logo (optional)',
  },
  redirectUrls: {
    'ui:help': 'URLs your app is allowed to redirect to with JWT authentication',
    items: {
      'ui:placeholder': 'https://your-app.example.com/callback',
    },
  },
  activeVersion: {
    'ui:help': 'Current active version of your app',
  },
  deploymentStatus: {
    'ui:help': 'Current deployment status of your app',
    'ui:widget': 'radio',
  },
};

export default function EditApplication({ app, onBack, onSuccess }: EditApplicationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
  } | null>(null);
  const handleSubmit = useCallback(
    async (data: any) => {
      try {
        setIsSubmitting(true);
        setStatusMessage({ message: 'Saving changes...', type: 'info' });

        await editApp(data.formData);

        if (onSuccess) {
          setStatusMessage({ message: 'Changes saved successfully', type: 'success' });
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } catch (error) {
        console.error('Error saving app:', error);
        setStatusMessage({
          message: `Error saving changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [app, onSuccess],
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
        <h1 className="text-3xl font-bold text-black">Edit Application</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span>Application Details</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 px-2 py-0"
              title="Edit your application details including name, description, and redirect URLs."
            >
              <Info className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form
            schema={jsonSchema}
            uiSchema={uiSchema}
            validator={validator}
            formData={app}
            onSubmit={handleSubmit}
            disabled={isSubmitting}
          >
            <div className="flex justify-end space-x-4 mt-6">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
