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
  SelectField,
  ImageUploadField,
} from '../../form-fields';

export const EditAppSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(10),
    contactEmail: z.string().email(),
    appUserUrl: z.string().url(),
    logo: z.string().optional(),
    redirectUris: z.array(z.string().url()),
    deploymentStatus: z.enum(['dev', 'staging', 'production']),
  })
  .partial()
  .strict();

export type EditAppFormData = z.infer<typeof EditAppSchema>;

interface EditAppFormProps {
  appData: any;
  onSubmit: (data: EditAppFormData) => Promise<void>;
  isSubmitting?: boolean;
}

const deploymentStatusOptions = [
  { value: 'dev', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
];

export function EditAppForm({ appData, onSubmit, isSubmitting = false }: EditAppFormProps) {
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
              errors={errors}
              label="App Name"
              placeholder="Enter app name"
            />

            <TextField
              name="contactEmail"
              register={register}
              errors={errors}
              label="Contact Email"
              placeholder="contact@example.com"
            />

            <LongTextField
              name="description"
              register={register}
              errors={errors}
              label="Description"
              placeholder="Describe your application"
              rows={4}
            />

            <TextField
              name="appUserUrl"
              register={register}
              errors={errors}
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
              errors={errors}
              watch={watch}
              setValue={setValue}
              label="Redirect URIs"
              placeholder="https://yourapp.com/callback"
            />

            <SelectField
              name="deploymentStatus"
              errors={errors}
              watch={watch}
              setValue={setValue}
              label="Deployment Status"
              options={deploymentStatusOptions}
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
