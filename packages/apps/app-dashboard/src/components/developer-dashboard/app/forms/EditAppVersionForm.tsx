import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { AppVersion } from '@/types/developer-dashboard/appTypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LongTextField } from '../../form-fields';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';

const { appVersionDoc } = docSchemas;

const { changes } = appVersionDoc.shape;

export const EditAppVersionSchema = z
  .object({
    changes,
  })
  .required()
  .strict();

export type EditAppVersionFormData = z.infer<typeof EditAppVersionSchema>;

interface EditAppVersionFormProps {
  versionData: AppVersion;
  onSubmit: (data: EditAppVersionFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditAppVersionForm({
  versionData,
  onSubmit,
  isSubmitting = false,
}: EditAppVersionFormProps) {
  const form = useForm<EditAppVersionFormData>({
    resolver: zodResolver(EditAppVersionSchema),
    defaultValues: {
      changes: versionData.changes || '',
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
        <CardTitle>Edit App Version {versionData?.version}</CardTitle>
        <CardDescription>Update the changes description for this version</CardDescription>
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
              {isSubmitting ? 'Updating Version...' : 'Update Version'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
