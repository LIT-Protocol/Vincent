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
import { TextField, LongTextField } from '../../form-fields';
import { DeploymentStatusSelectField } from '../../form-fields/array/DeploymentStatusSelectField';

const { toolDoc } = docSchemas;

const { packageName, description, title, activeVersion, deploymentStatus } = toolDoc.shape;

export const CreateToolSchema = z
  .object({ packageName, description, title, activeVersion, deploymentStatus })
  .strict();

export type CreateToolFormData = z.infer<typeof CreateToolSchema>;

interface CreateToolFormProps {
  onSubmit: (data: CreateToolFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateToolForm({ onSubmit, isSubmitting = false }: CreateToolFormProps) {
  const form = useForm<CreateToolFormData>({
    resolver: zodResolver(CreateToolSchema),
    defaultValues: {
      deploymentStatus: 'dev',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = form;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Tool</CardTitle>
        <CardDescription>Create a new Vincent tool</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <TextField
              name="packageName"
              register={register}
              error={errors.packageName?.message}
              label="Package Name"
              placeholder="Enter package name"
              required
            />

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

            <TextField
              name="activeVersion"
              register={register}
              error={errors.activeVersion?.message}
              label="Active Version"
              placeholder="Enter active version (e.g. 1.0.0)"
              required
            />

            <DeploymentStatusSelectField
              error={errors.deploymentStatus?.message}
              control={control}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Tool...' : 'Create Tool'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
