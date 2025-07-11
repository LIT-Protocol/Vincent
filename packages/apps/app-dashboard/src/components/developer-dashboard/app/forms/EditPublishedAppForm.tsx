import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TextField,
  LongTextField,
  ArrayField,
  NumberSelectField,
  ImageUploadField,
} from '../../form-fields';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { App, AppVersion } from '@/types/developer-dashboard/appTypes';
import { DeploymentStatusSelectField } from '../../form-fields/array/DeploymentStatusSelectField';

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
} = appDoc.shape;

export const EditPublishedAppSchema = z
  .object({
    name,
    description,
    contactEmail,
    appUserUrl,
    logo,
    redirectUris,
    deploymentStatus,
    activeVersion,
  })
  .required()
  .strict();

export type EditPublishedAppFormData = z.infer<typeof EditPublishedAppSchema>;

interface EditPublishedAppFormProps {
  appData: App;
  appVersions: AppVersion[];
  onSubmit: (data: EditPublishedAppFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditPublishedAppForm({
  appData,
  appVersions,
  onSubmit,
  isSubmitting = false,
}: EditPublishedAppFormProps) {
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

  // Create version options from appVersions, showing enabled/disabled status for all versions
  const versionOptions = appVersions.map((version) => ({
    value: version.version,
    label: `Version ${version.version} (${version.enabled ? 'Enabled' : 'Disabled'})`,
  }));

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit App</CardTitle>
        <CardDescription>Update an existing application</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            <DeploymentStatusSelectField
              error={errors.deploymentStatus?.message}
              control={control}
            />

            <NumberSelectField
              name="activeVersion"
              error={errors.activeVersion?.message}
              control={control}
              label="Active Version"
              options={versionOptions}
              required
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Update App
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
