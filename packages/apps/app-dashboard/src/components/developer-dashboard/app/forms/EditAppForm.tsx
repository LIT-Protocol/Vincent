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
  ArrayField,
  DeploymentStatusSelectField,
  NumberSelectField,
  ImageUploadField,
} from '@/components/developer-dashboard/form-fields';
import { App, AppVersion } from '@/types/developer-dashboard/appTypes';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { extractErrorMessage } from '@/utils/developer-dashboard/app-forms';

const { appDoc } = docSchemas;

const {
  name,
  description,
  contactEmail,
  appUserUrl,
  logo,
  redirectUris,
  deploymentStatus,
  activeVersion,
  delegateeAddresses,
} = appDoc.shape;

export const EditAppSchema = z
  .object({
    name,
    description,
    contactEmail,
    appUserUrl,
    logo,
    redirectUris,
    deploymentStatus,
    activeVersion,
    delegateeAddresses,
  })
  .required()
  .partial({ logo: true, activeVersion: true })
  .strict();

export type EditAppFormData = z.infer<typeof EditAppSchema>;

interface EditAppFormProps {
  appData: App;
  appVersions: AppVersion[];
  onSubmit: (data: EditAppFormData) => Promise<void>;
  isSubmitting?: boolean;
  isPublished?: boolean;
}

export function EditAppForm({
  appData,
  appVersions,
  onSubmit,
  isSubmitting = false,
  isPublished = false,
}: EditAppFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<EditAppFormData>({
    resolver: zodResolver(EditAppSchema),
    defaultValues: {
      name: appData.name,
      description: appData.description,
      contactEmail: appData.contactEmail,
      appUserUrl: appData.appUserUrl,
      logo: appData.logo,
      redirectUris: appData.redirectUris,
      deploymentStatus: appData.deploymentStatus,
      activeVersion: appData.activeVersion,
      delegateeAddresses: appData.delegateeAddresses,
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

  // Create version options from appVersions, showing enabled/disabled status for all versions
  const versionOptions = appVersions.map((version) => ({
    value: version.version,
    label: `Version ${version.version} (${version.enabled ? 'Enabled' : 'Disabled'})`,
  }));

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="space-y-8">
          {/* Two-column grid for sections with aligned rows */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 items-start">
            {/* Headers */}
            <h3
              className={`text-sm font-semibold ${theme.text} uppercase tracking-wider`}
              style={fonts.heading}
            >
              Basic Information
            </h3>
            <h3
              className={`text-sm font-semibold ${theme.text} uppercase tracking-wider`}
              style={fonts.heading}
            >
              Configuration
            </h3>

            {/* Row 1 */}
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

            {/* Row 2 */}
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

            {/* Row 3 */}
            <ImageUploadField
              name="logo"
              watch={watch}
              setValue={setValue}
              control={control}
              setError={setError}
              clearErrors={clearErrors}
              label="Logo"
            />
            <div className="space-y-6">
              <DeploymentStatusSelectField
                error={errors.deploymentStatus?.message}
                control={control}
              />

              {isPublished && (
                <NumberSelectField
                  name="activeVersion"
                  error={errors.activeVersion?.message}
                  control={control}
                  label="Active Version"
                  options={versionOptions}
                  required
                />
              )}
            </div>
          </div>

          {/* Divider */}
          <div className={`border-t ${theme.cardBorder}`} />

          {/* Advanced - Full width */}
          <div className="space-y-6">
            <h3
              className={`text-sm font-semibold ${theme.text} uppercase tracking-wider`}
              style={fonts.heading}
            >
              Advanced
            </h3>

            <ArrayField
              name="redirectUris"
              register={register}
              error={errors.redirectUris?.message}
              errors={errors}
              control={control}
              label="Redirect URIs"
              placeholder="https://yourapp.com/callback"
            />

            <ArrayField
              name="delegateeAddresses"
              register={register}
              error={errors.delegateeAddresses?.message}
              errors={errors}
              control={control}
              label="Delegatee Addresses"
              placeholder="0x1234567890123456789012345678901234567890"
              required
            />
          </div>

          {/* Status Messages */}
          {submitError && <StatusMessage message={submitError} type="error" />}
          {submitSuccess && <StatusMessage message="App updated successfully!" type="success" />}

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              className="w-full"
              style={{ backgroundColor: theme.brandOrange, ...fonts.body }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update App'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
