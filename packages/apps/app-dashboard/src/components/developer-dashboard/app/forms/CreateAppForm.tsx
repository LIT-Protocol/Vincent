import { z } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';

import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import {
  TextField,
  NumberField,
  LongTextField,
  ImageUploadField,
} from '@/components/developer-dashboard/form-fields';
import { DeploymentStatusSelectField } from '@/components/developer-dashboard/form-fields/array/DeploymentStatusSelectField';
import { theme, fonts } from '@/lib/themeClasses';
import { extractErrorMessage } from '@/utils/developer-dashboard/app-forms';

const { appDoc } = docSchemas;

const { appId, name, description, contactEmail, appUrl, logo, deploymentStatus } = appDoc.shape;

export const CreateAppSchema = z
  .object({
    appId,
    name,
    description,
    contactEmail,
    appUrl,
    logo,
    deploymentStatus,
  })
  .strict();

export type CreateAppFormData = z.infer<typeof CreateAppSchema>;

interface CreateAppFormProps {
  onSubmit: (data: CreateAppFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateAppForm({ onSubmit, isSubmitting = false }: CreateAppFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<CreateAppFormData>({
    resolver: zodResolver(CreateAppSchema),
    defaultValues: {
      deploymentStatus: 'dev',
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

  const handleFormSubmit = async (data: CreateAppFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await onSubmit(data);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Failed to create app:', error);
      setSubmitError(extractErrorMessage(error, 'Failed to create app'));
    }
  };

  return (
    <div className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}>
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="space-y-8">
              {/* Basic Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 items-start">
                {/* Left Column */}
                <div>
                  <h3 className={`text-sm font-semibold mb-4 ${theme.text}`} style={fonts.heading}>
                    Basic Information
                  </h3>
                  <div className="space-y-6">
                    <NumberField
                      name="appId"
                      register={register}
                      error={errors.appId?.message}
                      label="App ID"
                      placeholder="Enter on-chain app ID"
                      required
                      min={1}
                    />

                    <TextField
                      name="name"
                      register={register}
                      error={errors.name?.message}
                      label="App Name"
                      placeholder="Enter app name"
                      required
                    />

                    <TextField
                      name="contactEmail"
                      register={register}
                      error={errors.contactEmail?.message}
                      label="Contact Email"
                      placeholder="contact@example.com"
                      required
                    />

                    <LongTextField
                      name="description"
                      register={register}
                      error={errors.description?.message}
                      label="Description"
                      placeholder="Describe your application"
                      rows={4}
                      required
                    />

                    <TextField
                      name="appUrl"
                      register={register}
                      error={errors.appUrl?.message}
                      label="App User URL"
                      placeholder="https://yourapp.com"
                      required
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <h3 className={`text-sm font-semibold mb-4 ${theme.text}`} style={fonts.heading}>
                    Configuration
                  </h3>
                  <div className="space-y-6">
                    <ImageUploadField
                      name="logo"
                      watch={watch}
                      setValue={setValue}
                      control={control}
                      setError={setError}
                      clearErrors={clearErrors}
                      label="Logo"
                    />

                    <DeploymentStatusSelectField
                      error={errors.deploymentStatus?.message}
                      control={control}
                    />
                  </div>
                </div>
              </div>

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
                    App created successfully!
                  </span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                style={{ backgroundColor: theme.brandOrange }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating App...' : 'Create App'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
