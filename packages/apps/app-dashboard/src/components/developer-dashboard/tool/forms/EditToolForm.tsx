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
import { Tool, ToolVersion } from '@/types/developer-dashboard/appTypes';
import { DeploymentStatusSelectField } from '../../form-fields/array/DeploymentStatusSelectField';

const { toolDoc } = docSchemas;

const { packageName, description, title, activeVersion, deploymentStatus } = toolDoc.shape;

export const EditToolSchema = z
  .object({ packageName, description, title, activeVersion, deploymentStatus })
  .strict();

export type EditToolFormData = z.infer<typeof EditToolSchema>;

interface EditToolFormProps {
  toolData: Tool;
  toolVersions: ToolVersion[];
  onSubmit: (data: EditToolFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditToolForm({
  toolData,
  toolVersions,
  onSubmit,
  isSubmitting = false,
}: EditToolFormProps) {
  const form = useForm<EditToolFormData>({
    resolver: zodResolver(EditToolSchema),
    defaultValues: {
      packageName: toolData.packageName,
      description: toolData.description,
      title: toolData.title,
      activeVersion: toolData.activeVersion,
      deploymentStatus: toolData.deploymentStatus,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  // Create version options from toolVersions, showing enabled/disabled status for all versions
  const versionOptions = toolVersions.map((version) => ({
    value: version.version,
    label: `Version ${version.version}`,
  }));

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Tool</CardTitle>
        <CardDescription>Update an existing tool</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <LongTextField
              name="description"
              register={register}
              error={errors.description?.message}
              label="Description"
              placeholder="Describe your tool"
              rows={4}
              required
            />
            <TextField
              name="title"
              register={register}
              error={errors.title?.message}
              label="Title"
              placeholder="Enter tool title (user-readable)"
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
              Update Tool
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
