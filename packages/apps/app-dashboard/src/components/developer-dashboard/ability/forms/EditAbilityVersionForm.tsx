import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { AbilityVersion } from '@/types/developer-dashboard/appTypes';
import { LongTextField } from '../../form-fields';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { extractErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

const { abilityVersionDoc } = docSchemas;

const { changes } = abilityVersionDoc.shape;

export const EditAbilityVersionSchema = z
  .object({
    changes,
  })
  .required()
  .strict();

export type EditAbilityVersionFormData = z.infer<typeof EditAbilityVersionSchema>;

interface EditAbilityVersionFormProps {
  versionData: AbilityVersion;
  onSubmit: (data: EditAbilityVersionFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditAbilityVersionForm({
  versionData,
  onSubmit,
  isSubmitting = false,
}: EditAbilityVersionFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<EditAbilityVersionFormData>({
    resolver: zodResolver(EditAbilityVersionSchema),
    defaultValues: {
      changes: versionData.changes || '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const handleFormSubmit = async (data: EditAbilityVersionFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await onSubmit(data);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Failed to update ability version:', error);
      setSubmitError(extractErrorMessage(error, 'Failed to update ability version'));
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
          <StatusMessage message="Ability version updated successfully!" type="success" />
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
