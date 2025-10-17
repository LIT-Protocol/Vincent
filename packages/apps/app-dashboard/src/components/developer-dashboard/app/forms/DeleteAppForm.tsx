import { z } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import { TextField } from '../../form-fields';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { extractErrorMessage } from '@/utils/developer-dashboard/app-forms';

function buildConfirmationString(appName: string): string {
  return `I want to delete app ${appName}`;
}

const createDeleteAppSchema = (appName: string) => {
  const expectedConfirmation = buildConfirmationString(appName);
  return z.object({
    confirmation: z.string().refine((val) => val === expectedConfirmation, {
      message: `Please type exactly: "${expectedConfirmation}"`,
    }),
  });
};

export type DeleteAppFormData = {
  confirmation: string;
};

interface DeleteAppFormProps {
  appName: string;
  onSubmit: (data: DeleteAppFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function DeleteAppForm({ appName, onSubmit, isSubmitting = false }: DeleteAppFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const DeleteAppSchema = createDeleteAppSchema(appName);

  const form = useForm<DeleteAppFormData>({
    resolver: zodResolver(DeleteAppSchema),
    defaultValues: {
      confirmation: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = form;

  const expectedConfirmation = buildConfirmationString(appName);

  const handleFormSubmit = async (data: DeleteAppFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await onSubmit(data);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Failed to delete app:', error);
      setSubmitError(extractErrorMessage(error, 'Failed to delete app'));
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
              App deleted successfully!
            </span>
          </div>
        )}

        <Button
          type="submit"
          variant="destructive"
          className="w-full"
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? 'Deleting App...' : 'Delete App'}
        </Button>
      </form>
    </Form>
  );
}
