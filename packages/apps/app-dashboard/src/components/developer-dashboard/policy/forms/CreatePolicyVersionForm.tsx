import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/shared/ui/button';
import { Form } from '@/components/shared/ui/form';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { TextField, LongTextField } from '../../form-fields';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { Policy } from '@/types/developer-dashboard/appTypes';
import { theme, fonts } from '@/lib/themeClasses';
import { extractErrorMessage } from '@/utils/developer-dashboard/app-forms';

const { policyVersionDoc } = docSchemas;

const { version, changes } = policyVersionDoc.shape;

export const CreatePolicyVersionSchema = z.object({ version, changes }).strict();

export type CreatePolicyVersionFormData = z.infer<typeof CreatePolicyVersionSchema>;

interface CreatePolicyVersionFormProps {
  policy: Policy;
  onSubmit: (data: CreatePolicyVersionFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function CreatePolicyVersionForm({ onSubmit, isSubmitting }: CreatePolicyVersionFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<CreatePolicyVersionFormData>({
    resolver: zodResolver(CreatePolicyVersionSchema),
    defaultValues: {
      version: '',
      changes: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const handleFormSubmit = async (data: CreatePolicyVersionFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await onSubmit(data);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Failed to create policy version:', error);
      setSubmitError(extractErrorMessage(error, 'Failed to create policy version'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="space-y-6">
          <TextField
            name="version"
            register={register}
            error={errors.version?.message}
            label="Version"
            placeholder="1.0.0"
            required
          />

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
            <StatusMessage message="Policy version created successfully!" type="success" />
          )}

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              className="w-full"
              style={{ backgroundColor: theme.brandOrange, ...fonts.body }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Version...' : 'Create Version'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
