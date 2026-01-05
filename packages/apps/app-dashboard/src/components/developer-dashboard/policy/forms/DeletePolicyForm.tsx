import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import { TextField } from '../../form-fields';
import { extractErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { fonts } from '@/lib/themeClasses';

function buildConfirmationString(policyPackageName: string): string {
  return `I want to delete policy ${policyPackageName}`;
}

const createDeletePolicySchema = (policyPackageName: string) => {
  const expectedConfirmation = buildConfirmationString(policyPackageName);
  return z.object({
    confirmation: z.string().refine((val) => val === expectedConfirmation, {
      message: `Please type exactly: "${expectedConfirmation}"`,
    }),
  });
};

export type DeletePolicyFormData = {
  confirmation: string;
};

interface DeletePolicyFormProps {
  policyPackageName: string;
  onSubmit: (data: DeletePolicyFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function DeletePolicyForm({
  policyPackageName,
  onSubmit,
  isSubmitting = false,
}: DeletePolicyFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const DeletePolicySchema = createDeletePolicySchema(policyPackageName);

  const form = useForm<DeletePolicyFormData>({
    resolver: zodResolver(DeletePolicySchema),
    defaultValues: {
      confirmation: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = form;

  const expectedConfirmation = buildConfirmationString(policyPackageName);

  const handleFormSubmit = async (data: DeletePolicyFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await onSubmit(data);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Failed to delete policy:', error);
      setSubmitError(extractErrorMessage(error, 'Failed to delete policy'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2" style={fonts.body}>
          To confirm deletion, please type the following exactly:
        </p>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
          <code
            className="bg-red-100 dark:bg-red-800/20 px-2 py-1 rounded text-sm font-mono text-red-900 dark:text-red-200"
            style={fonts.body}
          >
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
            <span className="text-sm text-red-600 dark:text-red-400" style={fonts.body}>
              {submitError}
            </span>
          </div>
        )}

        {submitSuccess && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="text-sm text-green-600 dark:text-green-400" style={fonts.body}>
              Policy deleted successfully!
            </span>
          </div>
        )}

        <Button
          type="submit"
          variant="destructive"
          className="w-full"
          disabled={isSubmitting || !isValid}
          style={fonts.body}
        >
          {isSubmitting ? 'Deleting Policy...' : 'Delete Policy'}
        </Button>
      </form>
    </Form>
  );
}
