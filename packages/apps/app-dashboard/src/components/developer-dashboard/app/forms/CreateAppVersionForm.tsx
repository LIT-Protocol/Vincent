import { z } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import { LongTextField } from '@/components/developer-dashboard/form-fields';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { extractErrorMessage } from '@/utils/developer-dashboard/app-forms';

const { appVersionDoc } = docSchemas;

const { changes } = appVersionDoc.shape;

export const CreateAppVersionSchema = z.object({ changes }).strict();

export type CreateAppVersionFormData = z.infer<typeof CreateAppVersionSchema>;

interface CreateAppVersionFormProps {
  onSubmit: (data: CreateAppVersionFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateAppVersionForm({
  onSubmit,
  isSubmitting = false,
}: CreateAppVersionFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<CreateAppVersionFormData>({
    resolver: zodResolver(CreateAppVersionSchema),
    defaultValues: {
      changes: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const handleFormSubmit = async (data: CreateAppVersionFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await onSubmit(data);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Failed to create app version:', error);
      setSubmitError(extractErrorMessage(error, 'Failed to create app version'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <LongTextField
          name="changes"
          register={register}
          error={errors.changes?.message}
          label="Changes"
          placeholder="Describe what changed in this version..."
          rows={4}
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
              App version created successfully!
            </span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          style={{ backgroundColor: theme.brandOrange }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Version...' : 'Create Version'}
        </Button>
      </form>
    </Form>
  );
}
