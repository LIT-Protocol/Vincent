import { useCallback, useState, useEffect } from 'react';
import { ArrowLeft, Info, History, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusMessage } from '@/utils/statusMessage';
import { IAppDef, IAppVersionDef } from '@/api/app/types';
import editApp from '@/api/app/edit';
import listAppVersions from '@/api/app/listVersions';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import Form from '@rjsf/shadcn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  deploymentStatus: {
    'ui:help': 'Current deployment status of your app',
    'ui:widget': 'radio',
  },
};

export default function EditApplication({ app, onBack, onSuccess }: EditApplicationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>(app);
  const [versions, setVersions] = useState<IAppVersionDef[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
  } | null>(null);

  // Fetch available versions
  useEffect(() => {
    const fetchVersions = async () => {
      if (!app.appId) return;

      try {
        setIsLoadingVersions(true);
        const appVersions = await listAppVersions(app.appId);
        setVersions(appVersions);
      } catch (error) {
        console.error('Error loading app versions:', error);
        setStatusMessage({
          message: 'Failed to load application versions',
          type: 'error',
        });
      } finally {
        setIsLoadingVersions(false);
      }
    };

    fetchVersions();
  }, [app.appId]);

  const handleActiveVersionChange = (versionNumber: string) => {
    const numVersion = parseInt(versionNumber);
    setFormData({
      ...formData,
      activeVersion: numVersion,
    });

    setStatusMessage({
      message: `Active version will be changed to v${numVersion} when you save`,
      type: 'info',
    });
  };

  const formatChangesMessage = (changes: string) => {
    // Replace Unix timestamp with readable date
    const match = changes.match(/at (\d+)/);
    if (match && match[1]) {
      const date = new Date(parseInt(match[1]));
      const formattedDate = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      return changes.replace(/at \d+/, `on ${formattedDate}`);
    }
    return changes;
  };

  const handleSubmit = useCallback(
    async (data: any) => {
      try {
        setIsSubmitting(true);
        setStatusMessage({ message: 'Saving changes...', type: 'info' });

        // Merge the activeVersion from our state with the form data
        const updatedData = {
          ...data.formData,
          activeVersion: formData.activeVersion,
        };

        await editApp(updatedData);

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
    [formData, onSuccess],
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            <span>Version Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Active Version</label>
                <Select
                  defaultValue={app.activeVersion.toString()}
                  onValueChange={handleActiveVersionChange}
                  disabled={isLoadingVersions || versions.length === 0}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((version) => (
                      <SelectItem
                        key={version.versionNumber}
                        value={version.versionNumber.toString()}
                      >
                        v{version.versionNumber}{' '}
                        {version.versionNumber === app.activeVersion && '(Current)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Select which version of your app should be active
                </p>
              </div>

              <div className="md:col-span-2">
                <div className="border rounded-md">
                  <div
                    className="flex justify-between items-center p-3 border-b cursor-pointer"
                    onClick={() => setShowVersionHistory(!showVersionHistory)}
                  >
                    <h3 className="text-sm font-medium">Version History</h3>
                    {showVersionHistory ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>

                  {showVersionHistory && (
                    <div className="p-3">
                      {isLoadingVersions ? (
                        <div className="py-4 text-center">Loading versions...</div>
                      ) : versions.length === 0 ? (
                        <div className="py-4 text-center">No versions available</div>
                      ) : (
                        <div className="space-y-2 max-h-36 overflow-y-auto">
                          {versions.map((version) => (
                            <div
                              key={version.versionNumber}
                              className="flex items-center p-2 border rounded-md"
                            >
                              <div className="flex-1">
                                <div className="font-medium">v{version.versionNumber}</div>
                                <div className="text-xs text-gray-500">
                                  {formatChangesMessage(version.changes)}
                                </div>
                              </div>
                              {version.versionNumber === formData.activeVersion && (
                                <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Active
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
              {onBack && (
                <Button type="button" variant="outline" onClick={onBack}>
                  Cancel
                </Button>
              )}
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
