import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import { AbilityVersion } from '@/types/developer-dashboard/appTypes';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card';
import { LongTextField } from '../../form-fields';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';

const { abilityVersionDoc } = docSchemas;

const { changes } = abilityVersionDoc.shape;

export const EditAbilityVersionSchema = z
  .object({
    changes,
  })
  .required()
  .strict();

export type EditAbilityVersionFormData = z.infer<typeof EditAbilityVersionSchema>;

interface EditAbilityVersionFormProps {
  versionData: AbilityVersion;
  onSubmit: (data: EditAbilityVersionFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditAbilityVersionForm({
  versionData,
  onSubmit,
  isSubmitting = false,
}: EditAbilityVersionFormProps) {
  const form = useForm<EditAbilityVersionFormData>({
    resolver: zodResolver(EditAbilityVersionSchema),
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
        <CardTitle>Edit Ability Version {versionData?.version}</CardTitle>
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
