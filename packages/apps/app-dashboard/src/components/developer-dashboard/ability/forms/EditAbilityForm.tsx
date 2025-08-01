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
import { TextField, LongTextField, SelectField, ImageUploadField } from '../../form-fields';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { Ability, AbilityVersion } from '@/types/developer-dashboard/appTypes';
import { DeploymentStatusSelectField } from '../../form-fields/array/DeploymentStatusSelectField';

const { abilityDoc } = docSchemas;

const { packageName, description, title, logo, activeVersion, deploymentStatus } = abilityDoc.shape;

export const EditAbilitySchema = z
  .object({ packageName, description, title, logo, activeVersion, deploymentStatus })
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
  const form = useForm<EditAbilityFormData>({
    resolver: zodResolver(EditAbilitySchema),
    defaultValues: {
      packageName: abilityData.packageName,
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

  // Create version options from abilityVersions, showing enabled/disabled status for all versions
  const versionOptions = abilityVersions.map((version) => ({
    value: version.version,
    label: `Version ${version.version}`,
  }));

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Ability</CardTitle>
        <CardDescription>Update an existing ability</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            <DeploymentStatusSelectField
              error={errors.deploymentStatus?.message}
              control={control}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Update Ability
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
