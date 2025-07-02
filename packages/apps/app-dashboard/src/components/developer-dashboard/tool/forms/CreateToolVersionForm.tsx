import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { TextField, LongTextField } from '../../form-fields';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { Tool } from '@/types/developer-dashboard/appTypes';

const { toolVersionDoc } = docSchemas;

const { version, changes } = toolVersionDoc.shape;

export const CreateToolVersionSchema = z.object({ version, changes }).strict();

export type CreateToolVersionFormData = z.infer<typeof CreateToolVersionSchema>;

interface CreateToolVersionFormProps {
  tool: Tool;
  onSubmit: (data: CreateToolVersionFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function CreateToolVersionForm({
  tool,
  onSubmit,
  isSubmitting,
}: CreateToolVersionFormProps) {
  const form = useForm<CreateToolVersionFormData>({
    resolver: zodResolver(CreateToolVersionSchema),
    defaultValues: {
      version: '',
      changes: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const handleFormSubmit = async (data: CreateToolVersionFormData) => {
    await onSubmit(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Tool Version</CardTitle>
        <CardDescription>Create a new version for {tool.packageName}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <TextField
              name="version"
              register={register}
              error={errors.version?.message}
              label="Version"
              placeholder="1.0.0"
              required
            />

            <LongTextField
              name="changes"
              register={register}
              error={errors.changes?.message}
              label="Changes"
              placeholder="Describe what changed in this version..."
              rows={4}
              required
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Version...' : 'Create Version'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
