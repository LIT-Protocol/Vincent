import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';

import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import {
  TextField,
  LongTextField,
  DeploymentStatusSelectField,
  ImageUploadField,
} from '@/components/developer-dashboard/form-fields';
import { App } from '@/types/developer-dashboard/appTypes';
import { theme, fonts } from '@/lib/themeClasses';
import { extractErrorMessage } from '@/utils/developer-dashboard/app-forms';

const { appDoc } = docSchemas;

const { name, description, contactEmail, appUrl, logo, deploymentStatus, activeVersion } =
  appDoc.shape;

export const EditAppSchema = z
  .object({
    name,
    description,
    contactEmail,
    appUrl,
    logo,
    deploymentStatus,
    activeVersion,
  })
  .required()
  .partial({ logo: true, activeVersion: true })
  .strict();

export type EditAppFormData = z.infer<typeof EditAppSchema>;

interface EditAppFormProps {
  appData: App;
  onSubmit: (data: EditAppFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditAppForm({ appData, onSubmit, isSubmitting = false }: EditAppFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<EditAppFormData>({
    resolver: zodResolver(EditAppSchema),
    defaultValues: {
      name: appData.name,
      description: appData.description,
      contactEmail: appData.contactEmail,
      appUrl: appData.appUrl,
      logo: appData.logo,
      deploymentStatus: appData.deploymentStatus,
      activeVersion: appData.activeVersion,
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

  const handleFormSubmit = async (data: EditAppFormData) => {
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
          name="appUrl"
          register={register}
          error={errors.appUrl?.message}
          label="App URL"
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

        <DeploymentStatusSelectField error={errors.deploymentStatus?.message} control={control} />

        {/* Status Messages */}
        {submitError && <StatusMessage message={submitError} type="error" />}
        {submitSuccess && <StatusMessage message="App updated successfully!" type="success" />}

        {/* Submit Button */}
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
