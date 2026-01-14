import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { PolicyVersion } from '@/types/developer-dashboard/appTypes';
import { LongTextField } from '../../form-fields';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { extractErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { theme, fonts } from '@/lib/themeClasses';

const { policyVersionDoc } = docSchemas;

const { changes } = policyVersionDoc.shape;

export const EditPolicyVersionSchema = z
  .object({
    changes,
  })
  .required()
  .strict();

export type EditPolicyVersionFormData = z.infer<typeof EditPolicyVersionSchema>;

interface EditPolicyVersionFormProps {
  versionData: PolicyVersion;
  onSubmit: (data: EditPolicyVersionFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditPolicyVersionForm({
  versionData,
  onSubmit,
  isSubmitting = false,
}: EditPolicyVersionFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<EditPolicyVersionFormData>({
    resolver: zodResolver(EditPolicyVersionSchema),
    defaultValues: {
      changes: versionData.changes || '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const handleFormSubmit = async (data: EditPolicyVersionFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await onSubmit(data);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Failed to update policy version:', error);
      setSubmitError(extractErrorMessage(error, 'Failed to update policy version'));
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
          <StatusMessage message="Policy version updated successfully!" type="success" />
        )}

        <Button
          type="submit"
          className="w-full"
          style={{ backgroundColor: theme.brandOrange, ...fonts.body }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Updating Version...' : 'Update Version'}
        </Button>
      </form>
    </Form>
  );
}
