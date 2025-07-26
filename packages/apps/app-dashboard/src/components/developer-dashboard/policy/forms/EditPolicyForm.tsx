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
import { TextField, LongTextField, SelectField } from '../../form-fields';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { Policy, PolicyVersion } from '@/types/developer-dashboard/appTypes';
import { DeploymentStatusSelectField } from '../../form-fields/array/DeploymentStatusSelectField';

const { policyDoc } = docSchemas;

const { packageName, description, title, activeVersion, deploymentStatus } = policyDoc.shape;

export const EditPolicySchema = z
  .object({ packageName, description, title, activeVersion, deploymentStatus })
  .strict();

export type EditPolicyFormData = z.infer<typeof EditPolicySchema>;

interface EditPolicyFormProps {
  policyData: Policy;
  policyVersions: PolicyVersion[];
  onSubmit: (data: EditPolicyFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditPolicyForm({
  policyData,
  policyVersions,
  onSubmit,
  isSubmitting = false,
}: EditPolicyFormProps) {
  const form = useForm<EditPolicyFormData>({
    resolver: zodResolver(EditPolicySchema),
    defaultValues: {
      packageName: policyData.packageName,
      description: policyData.description,
      title: policyData.title,
      activeVersion: policyData.activeVersion,
      deploymentStatus: policyData.deploymentStatus,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  // Create version options from policyVersions, showing enabled/disabled status for all versions
  const versionOptions = policyVersions.map((version) => ({
    value: version.version,
    label: `Version ${version.version}`,
  }));

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Policy</CardTitle>
        <CardDescription>Update an existing policy</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <LongTextField
              name="description"
              register={register}
              error={errors.description?.message}
              label="Description"
              placeholder="Describe your policy"
              rows={4}
              required
            />
            <TextField
              name="title"
              register={register}
              error={errors.title?.message}
              label="Title"
              placeholder="Enter policy title (user-readable)"
              required
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
              Update Policy
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
