import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card';
import { Form } from '@/components/shared/ui/form';
import { TextField, LongTextField } from '../../form-fields';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { Ability } from '@/types/developer-dashboard/appTypes';

const { abilityVersionDoc } = docSchemas;

const { version, changes } = abilityVersionDoc.shape;

export const CreateAbilityVersionSchema = z.object({ version, changes }).strict();

export type CreateAbilityVersionFormData = z.infer<typeof CreateAbilityVersionSchema>;

interface CreateAbilityVersionFormProps {
  ability: Ability;
  onSubmit: (data: CreateAbilityVersionFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function CreateAbilityVersionForm({
  ability,
  onSubmit,
  isSubmitting,
}: CreateAbilityVersionFormProps) {
  const form = useForm<CreateAbilityVersionFormData>({
    resolver: zodResolver(CreateAbilityVersionSchema),
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

  const handleFormSubmit = async (data: CreateAbilityVersionFormData) => {
    await onSubmit(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Ability Version</CardTitle>
        <CardDescription>Create a new version for {ability.packageName}</CardDescription>
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
