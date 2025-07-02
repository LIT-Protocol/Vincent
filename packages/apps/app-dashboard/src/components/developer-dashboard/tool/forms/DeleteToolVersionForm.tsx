import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SelectField, TextField } from '../../form-fields';
import { Tool, ToolVersion } from '@/types/developer-dashboard/appTypes';

function buildConfirmationString(title: string, version: string): string {
  return `I want to delete tool ${title} version ${version}`;
}

const createDeleteToolVersionSchema = (
  title: string,
  version: string,
  isActiveVersion: boolean,
) => {
  const expectedConfirmation = buildConfirmationString(title, version);
  const baseSchema = z.object({
    confirmation: z.string().refine((val) => val === expectedConfirmation, {
      message: `Please type exactly: "${expectedConfirmation}"`,
    }),
  });

  if (isActiveVersion) {
    return baseSchema.extend({
      activeVersion: z.string(),
    });
  }

  return baseSchema.extend({
    activeVersion: z.string().optional(),
  });
};

export type DeleteToolVersionFormData = {
  confirmation: string;
  activeVersion?: string;
};

interface DeleteToolVersionFormProps {
  tool: Tool;
  version: string;
  versions: ToolVersion[];
  onSubmit: (data: DeleteToolVersionFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function DeleteToolVersionForm({
  tool,
  version,
  versions,
  onSubmit,
  isSubmitting = false,
}: DeleteToolVersionFormProps) {
  const DeleteToolVersionSchema = createDeleteToolVersionSchema(
    tool.title || '',
    version,
    version === tool.activeVersion,
  );

  const form = useForm<DeleteToolVersionFormData>({
    resolver: zodResolver(DeleteToolVersionSchema),
    defaultValues: {
      confirmation: '',
      ...(version === tool.activeVersion && { activeVersion: undefined }),
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    control,
  } = form;

  const expectedConfirmation = buildConfirmationString(tool.title || '', version);

  // Create version options from policyVersions, showing enabled/disabled status for all versions
  // Filter out the version being deleted since it can't be the new active version
  const versionOptions = versions
    .filter((v) => v.version !== version)
    .map((version) => ({
      value: version.version,
      label: `Version ${version.version}`,
    }));

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-red-600">Delete Tool Version</CardTitle>
        <CardDescription>
          Please make sure you're absolutely certain you want to delete this tool version.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 mb-2">
                To confirm deletion, please type the following exactly:
              </p>
              <code className="bg-red-100 px-2 py-1 rounded text-sm font-mono text-red-900">
                {expectedConfirmation}
              </code>
            </div>

            <TextField
              name="confirmation"
              register={register}
              error={errors.confirmation?.message}
              label="Confirmation"
              placeholder=""
              required
            />

            {version === tool.activeVersion && (
              <div className="space-y-4">
                <div className="text-sm text-red-500">
                  This is the active version of the tool. Please choose a new active version before
                  deleting this one.
                </div>
                <SelectField
                  name="activeVersion"
                  error={errors.activeVersion?.message}
                  control={control}
                  label="New Active Version"
                  options={versionOptions}
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? 'Deleting Tool Version...' : 'Delete Tool Version'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
