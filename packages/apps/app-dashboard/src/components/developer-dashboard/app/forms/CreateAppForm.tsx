import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { TextField, LongTextField, ArrayField, ImageUploadField } from '../../form-fields';
import { DeploymentStatusSelectField } from '../../form-fields/array/DeploymentStatusSelectField';

const { appDoc } = docSchemas;

const { name, description, contactEmail, appUserUrl, logo, redirectUris, deploymentStatus, delegateeAddresses } =
  appDoc.shape;

export const CreateAppSchema = z
  .object({ name, description, contactEmail, appUserUrl, logo, redirectUris, deploymentStatus, delegateeAddresses })
  .strict();

export type CreateAppFormData = z.infer<typeof CreateAppSchema>;

interface CreateAppFormProps {
  onSubmit: (data: CreateAppFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateAppForm({ onSubmit, isSubmitting = false }: CreateAppFormProps) {
  const form = useForm<CreateAppFormData>({
    resolver: zodResolver(CreateAppSchema),
    defaultValues: {
      redirectUris: [''],
      delegateeAddresses: [''],
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New App</CardTitle>
        <CardDescription>Create a new Vincent application and select initial tools</CardDescription>
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
              name="appUserUrl"
              register={register}
              error={errors.appUserUrl?.message}
              label="App User URL"
              placeholder="https://yourapp.com"
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

            <ArrayField
              name="redirectUris"
              register={register}
              error={errors.redirectUris?.message}
              errors={errors}
              control={control}
              label="Redirect URIs"
              placeholder="https://yourapp.com/callback"
              required
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

            <DeploymentStatusSelectField
              error={errors.deploymentStatus?.message}
              control={control}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating App...' : 'Create App'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
