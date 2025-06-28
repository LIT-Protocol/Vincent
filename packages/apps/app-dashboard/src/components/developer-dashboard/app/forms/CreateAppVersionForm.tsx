import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { App } from '@/types/developer-dashboard/appTypes';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LongTextField } from '../../form-fields';

const { appVersionDoc } = docSchemas;

const { changes } = appVersionDoc.shape;

export const CreateAppVersionSchema = z.object({ changes }).strict();

export type CreateAppVersionFormData = z.infer<typeof CreateAppVersionSchema>;

interface CreateAppVersionFormProps {
  appData: App;
  onSubmit: (data: CreateAppVersionFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateAppVersionForm({
  appData,
  onSubmit,
  isSubmitting = false,
}: CreateAppVersionFormProps) {
  const form = useForm<CreateAppVersionFormData>({
    resolver: zodResolver(CreateAppVersionSchema),
    defaultValues: {
      changes: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create App Version</CardTitle>
        <CardDescription>Create a new version of {appData.name} and select tools</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
