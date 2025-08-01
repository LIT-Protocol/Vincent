import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { TextField, LongTextField, ImageUploadField } from '../../form-fields';
import { DeploymentStatusSelectField } from '../../form-fields/array/DeploymentStatusSelectField';

const { abilityDoc } = docSchemas;

const { packageName, description, title, logo, activeVersion, deploymentStatus } = abilityDoc.shape;

export const CreateAbilitySchema = z
  .object({ packageName, description, title, logo, activeVersion, deploymentStatus })
  .strict();

export type CreateAbilityFormData = z.infer<typeof CreateAbilitySchema>;

interface CreateAbilityFormProps {
  onSubmit: (data: CreateAbilityFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateAbilityForm({ onSubmit, isSubmitting = false }: CreateAbilityFormProps) {
  const form = useForm<CreateAbilityFormData>({
    resolver: zodResolver(CreateAbilitySchema),
    defaultValues: {
      deploymentStatus: 'dev',
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Ability</CardTitle>
        <CardDescription>Define a permission for users to approve</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <TextField
              name="packageName"
              register={register}
              error={errors.packageName?.message}
              label="Package Name"
              placeholder="Enter the published npm package name (e.g. @lit-protocol/vincent-ability)"
              required
            />

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

            <TextField
              name="activeVersion"
              register={register}
              error={errors.activeVersion?.message}
              label="Active Version"
              placeholder="Enter active version (e.g. 1.0.0). This must be a version that is published to npm."
              required
            />

            <DeploymentStatusSelectField
              error={errors.deploymentStatus?.message}
              control={control}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Ability...' : 'Create Ability'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
