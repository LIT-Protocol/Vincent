import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import { TextField, LongTextField, ArrayField, ImageUploadField } from '../../form-fields';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { App } from '@/types/developer-dashboard/appTypes';
import { DeploymentStatusSelectField } from '../../form-fields/array/DeploymentStatusSelectField';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { extractErrorMessage } from '@/utils/developer-dashboard/app-forms';

const { appDoc } = docSchemas;

const { name, description, contactEmail, appUserUrl, logo, redirectUris, deploymentStatus } =
  appDoc.shape;

export const EditPublishedAppSchema = z
  .object({
    name,
    description,
    contactEmail,
    appUserUrl,
    logo,
    redirectUris,
    deploymentStatus,
  })
  .required()
  .partial({ logo: true })
  .strict();

export type EditPublishedAppFormData = z.infer<typeof EditPublishedAppSchema>;

interface EditPublishedAppFormProps {
  appData: App;
  onSubmit: (data: EditPublishedAppFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditPublishedAppForm({
  appData,
  onSubmit,
  isSubmitting = false,
}: EditPublishedAppFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<EditPublishedAppFormData>({
    resolver: zodResolver(EditPublishedAppSchema),
    defaultValues: {
      name: appData.name,
      description: appData.description,
      contactEmail: appData.contactEmail,
      appUserUrl: appData.appUserUrl,
      logo: appData.logo,
      redirectUris: appData.redirectUris,
      deploymentStatus: appData.deploymentStatus,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    setError,
    clearErrors,
    formState: { errors },
  } = form;

  const handleFormSubmit = async (data: EditPublishedAppFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await onSubmit(data);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Failed to update app:', error);
      setSubmitError(extractErrorMessage(error, 'Failed to update app'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <TextField
          name="name"
          register={register}
          error={errors.name?.message}
          label="App Name"
          placeholder="Enter app name"
        />

        <TextField
          name="contactEmail"
          register={register}
          error={errors.contactEmail?.message}
          label="Contact Email"
          placeholder="contact@example.com"
        />

        <LongTextField
          name="description"
          register={register}
          error={errors.description?.message}
          label="Description"
          placeholder="Describe your application"
          rows={4}
        />

        <TextField
          name="appUserUrl"
          register={register}
          error={errors.appUserUrl?.message}
          label="App User URL"
          placeholder="https://yourapp.com"
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

        <ArrayField
          name="redirectUris"
          register={register}
          error={errors.redirectUris?.message}
          errors={errors}
          control={control}
          label="Redirect URIs"
          placeholder="https://yourapp.com/callback"
        />

        <DeploymentStatusSelectField error={errors.deploymentStatus?.message} control={control} />

        {/* Status Messages */}
        {submitError && <StatusMessage message={submitError} type="error" />}
        {submitSuccess && <StatusMessage message="App updated successfully!" type="success" />}

        <Button
          type="submit"
          className="w-full"
          style={{ backgroundColor: theme.brandOrange, ...fonts.body }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Updating...' : 'Update App'}
        </Button>
      </form>
    </Form>
  );
}
