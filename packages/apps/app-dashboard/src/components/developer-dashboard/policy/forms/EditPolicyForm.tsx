import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { TextField, LongTextField, SelectField, ImageUploadField } from '../../form-fields';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { Policy, PolicyVersion } from '@/types/developer-dashboard/appTypes';
import { DeploymentStatusSelectField } from '../../form-fields/array/DeploymentStatusSelectField';
import { theme, fonts } from '@/lib/themeClasses';
import { extractErrorMessage } from '@/utils/developer-dashboard/app-forms';

const { policyDoc } = docSchemas;

const { description, title, logo, activeVersion, deploymentStatus } = policyDoc.shape;

export const EditPolicySchema = z
  .object({ description, title, logo, activeVersion, deploymentStatus })
  .partial({ logo: true })
  .strict();

export type EditPolicyFormData = z.infer<typeof EditPolicySchema>;

interface EditPolicyFormProps {
  policyData: Policy;
  policyVersions: PolicyVersion[];
  onSubmit: (data: EditPolicyFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditPolicyForm({
  policyData,
  policyVersions,
  onSubmit,
  isSubmitting = false,
}: EditPolicyFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<EditPolicyFormData>({
    resolver: zodResolver(EditPolicySchema),
    defaultValues: {
      description: policyData.description,
      title: policyData.title,
      logo: policyData.logo,
      activeVersion: policyData.activeVersion,
      deploymentStatus: policyData.deploymentStatus,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
    control,
  } = form;

  const handleFormSubmit = async (data: EditPolicyFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await onSubmit(data);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Failed to update policy:', error);
      setSubmitError(extractErrorMessage(error, 'Failed to update policy'));
    }
  };

  // Create version options from policyVersions
  const versionOptions = policyVersions.map((version) => ({
    value: version.version,
    label: `Version ${version.version}`,
  }));

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="space-y-8">
          <LongTextField
            name="description"
            register={register}
            error={errors.description?.message}
            label="Description"
            placeholder="Describe your policy"
            rows={4}
            required
          />

          <TextField
            name="title"
            register={register}
            error={errors.title?.message}
            label="Title"
            placeholder="Enter policy title (user-readable)"
            required
          />

          <ImageUploadField
            name="logo"
            watch={watch}
            setValue={setValue}
            control={control}
            setError={setError}
            clearErrors={clearErrors}
            label="Logo"
          />

          <SelectField
            name="activeVersion"
            error={errors.activeVersion?.message}
            control={control}
            label="Active Version"
            options={versionOptions}
            required
          />

          <DeploymentStatusSelectField error={errors.deploymentStatus?.message} control={control} />

          {/* Status Messages */}
          {submitError && <StatusMessage message={submitError} type="error" />}
          {submitSuccess && <StatusMessage message="Policy updated successfully!" type="success" />}

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              className="w-full"
              style={{ backgroundColor: theme.brandOrange, ...fonts.body }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Policy'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
