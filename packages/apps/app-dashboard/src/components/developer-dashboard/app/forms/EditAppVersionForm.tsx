import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';

import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { AppVersion } from '@/types/developer-dashboard/appTypes';
import { LongTextField } from '@/components/developer-dashboard/form-fields';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { extractErrorMessage } from '@/utils/developer-dashboard/app-forms';

const { appVersionDoc } = docSchemas;

const { changes } = appVersionDoc.shape;

export const EditAppVersionSchema = z
  .object({
    changes,
  })
  .required()
  .strict();

export type EditAppVersionFormData = z.infer<typeof EditAppVersionSchema>;

interface EditAppVersionFormProps {
  versionData: AppVersion;
  onSubmit: (data: EditAppVersionFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditAppVersionForm({
  versionData,
  onSubmit,
  isSubmitting = false,
}: EditAppVersionFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<EditAppVersionFormData>({
    resolver: zodResolver(EditAppVersionSchema),
    defaultValues: {
      changes: versionData.changes || '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const handleFormSubmit = async (data: EditAppVersionFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await onSubmit(data);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Failed to update app version:', error);
      setSubmitError(extractErrorMessage(error, 'Failed to update app version'));
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
        {submitError && <StatusMessage message={submitError} type="error" />}
        {submitSuccess && (
          <StatusMessage message="App version updated successfully!" type="success" />
        )}

        <Button
          type="submit"
          className="w-full"
          style={{ backgroundColor: theme.brandOrange }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Updating Version...' : 'Update Version'}
        </Button>
      </form>
    </Form>
  );
}
