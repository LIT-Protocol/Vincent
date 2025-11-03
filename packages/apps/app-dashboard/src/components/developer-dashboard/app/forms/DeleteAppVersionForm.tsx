import { z } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import { NumberSelectField, TextField } from '../../form-fields';
import { App, AppVersion } from '@/types/developer-dashboard/appTypes';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { extractErrorMessage } from '@/utils/developer-dashboard/app-forms';

function buildConfirmationString(title: string, version: number): string {
  return `I want to delete app ${title} version ${version}`;
}

const createDeleteAppVersionSchema = (title: string, version: number, isActiveVersion: boolean) => {
  const expectedConfirmation = buildConfirmationString(title, version);
  const baseSchema = z.object({
    confirmation: z.string().refine((val) => val === expectedConfirmation, {
      message: `Please type exactly: "${expectedConfirmation}"`,
    }),
  });

  if (isActiveVersion) {
    return baseSchema.extend({
      activeVersion: z.number(),
    });
  }

  return baseSchema.extend({
    activeVersion: z.number().optional(),
  });
};

export type DeleteAppVersionFormData = {
  confirmation: string;
  activeVersion?: number;
};

interface DeleteAppVersionFormProps {
  app: App;
  version: number;
  versions: AppVersion[];
  onSubmit: (data: DeleteAppVersionFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function DeleteAppVersionForm({
  app,
  version,
  versions,
  onSubmit,
  isSubmitting = false,
}: DeleteAppVersionFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const DeleteAppVersionSchema = createDeleteAppVersionSchema(
    app.name,
    version,
    version === app.activeVersion,
  );

  const form = useForm<DeleteAppVersionFormData>({
    resolver: zodResolver(DeleteAppVersionSchema),
    defaultValues: {
      confirmation: '',
      ...(version === app.activeVersion && { activeVersion: undefined }),
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    control,
  } = form;

  const expectedConfirmation = buildConfirmationString(app.name, version);

  // Create version options from policyVersions, showing enabled/disabled status for all versions
  // Filter out the version being deleted since it can't be the new active version
  const versionOptions = versions
    .filter((v) => v.version !== version)
    .map((version) => ({
      value: version.version,
      label: `Version ${version.version}`,
    }));

  const handleFormSubmit = async (data: DeleteAppVersionFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await onSubmit(data);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Failed to delete app version:', error);
      setSubmitError(extractErrorMessage(error, 'Failed to delete app version'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          To confirm deletion, please type the following exactly:
        </p>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
          <code className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-sm font-mono text-red-900 dark:text-red-200">
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

        {version === app.activeVersion && (
          <div className="space-y-4">
            <div className="text-sm text-red-500 dark:text-red-400">
              This is the active version of the app. Please choose a new active version before
              deleting this one.
            </div>
            <NumberSelectField
              name="activeVersion"
              error={errors.activeVersion?.message}
              control={control}
              label="New Active Version"
              options={versionOptions}
              required
            />
          </div>
        )}

        {/* Status Messages */}
        {submitError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-600 dark:text-red-400">{submitError}</span>
          </div>
        )}

        {submitSuccess && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="text-sm text-green-600 dark:text-green-400">
              App version deleted successfully!
            </span>
          </div>
        )}

        <Button
          type="submit"
          variant="destructive"
          className="w-full"
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? 'Deleting App Version...' : 'Delete App Version'}
        </Button>
      </form>
    </Form>
  );
}
