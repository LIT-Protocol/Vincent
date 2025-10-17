import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { TextField, LongTextField, SelectField, ImageUploadField } from '../../form-fields';
import { Ability, AbilityVersion } from '@/types/developer-dashboard/appTypes';
import { DeploymentStatusSelectField } from '../../form-fields/array/DeploymentStatusSelectField';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { extractErrorMessage } from '@/utils/developer-dashboard/app-forms';

const { abilityDoc } = docSchemas;

const { description, title, logo, activeVersion, deploymentStatus } = abilityDoc.shape;

export const EditAbilitySchema = z
  .object({ description, title, logo, activeVersion, deploymentStatus })
  .partial({ logo: true })
  .strict();

export type EditAbilityFormData = z.infer<typeof EditAbilitySchema>;

interface EditAbilityFormProps {
  abilityData: Ability;
  abilityVersions: AbilityVersion[];
  onSubmit: (data: EditAbilityFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditAbilityForm({
  abilityData,
  abilityVersions,
  onSubmit,
  isSubmitting = false,
}: EditAbilityFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<EditAbilityFormData>({
    resolver: zodResolver(EditAbilitySchema),
    defaultValues: {
      description: abilityData.description,
      title: abilityData.title,
      logo: abilityData.logo,
      activeVersion: abilityData.activeVersion,
      deploymentStatus: abilityData.deploymentStatus,
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

  const handleFormSubmit = async (data: EditAbilityFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await onSubmit(data);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Failed to update ability:', error);
      setSubmitError(extractErrorMessage(error, 'Failed to update ability'));
    }
  };

  // Create version options from abilityVersions
  const versionOptions = abilityVersions.map((version) => ({
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
            placeholder="Describe your ability"
            rows={4}
            required
          />

          <TextField
            name="title"
            register={register}
            error={errors.title?.message}
            label="Title"
            placeholder="Enter ability title (user-readable)"
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
          {submitSuccess && (
            <StatusMessage message="Ability updated successfully!" type="success" />
          )}

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              className="w-full"
              style={{ backgroundColor: theme.brandOrange, ...fonts.body }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Ability'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
