import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { TextField, LongTextField } from '../../form-fields';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { Policy } from '@/types/developer-dashboard/appTypes';

const { policyVersionDoc } = docSchemas;

const { version, changes } = policyVersionDoc.shape;

export const CreatePolicyVersionSchema = z.object({ version, changes }).strict();

export type CreatePolicyVersionFormData = z.infer<typeof CreatePolicyVersionSchema>;

interface CreatePolicyVersionFormProps {
  policy: Policy;
  onSubmit: (data: CreatePolicyVersionFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function CreatePolicyVersionForm({
  policy,
  onSubmit,
  isSubmitting,
}: CreatePolicyVersionFormProps) {
  const form = useForm<CreatePolicyVersionFormData>({
    resolver: zodResolver(CreatePolicyVersionSchema),
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

  const handleFormSubmit = async (data: CreatePolicyVersionFormData) => {
    await onSubmit(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Policy Version</CardTitle>
        <CardDescription>Create a new version for {policy.packageName}</CardDescription>
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
