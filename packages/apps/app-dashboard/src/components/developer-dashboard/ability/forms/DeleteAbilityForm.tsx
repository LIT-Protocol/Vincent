import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent } from '@/components/shared/ui/card';
import { TextField } from '../../form-fields';

function buildConfirmationString(title: string): string {
  return `I want to delete ability ${title}`;
}

const createDeleteAbilitySchema = (title: string) => {
  const expectedConfirmation = buildConfirmationString(title);
  return z.object({
    confirmation: z.string().refine((val) => val === expectedConfirmation, {
      message: `Please type exactly: "${expectedConfirmation}"`,
    }),
  });
};

export type DeleteAbilityFormData = {
  confirmation: string;
};

interface DeleteAbilityFormProps {
  title: string;
  onSubmit: (data: DeleteAbilityFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function DeleteAbilityForm({
  title,
  onSubmit,
  isSubmitting = false,
}: DeleteAbilityFormProps) {
  const DeleteAbilitySchema = createDeleteAbilitySchema(title);

  const form = useForm<DeleteAbilityFormData>({
    resolver: zodResolver(DeleteAbilitySchema),
    defaultValues: {
      confirmation: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = form;

  const expectedConfirmation = buildConfirmationString(title);

  return (
    <Card className="w-full max-w-2xl mx-auto dark:bg-neutral-800 dark:border-white/10">
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              To confirm deletion, please type the following exactly:
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
              <code className="bg-red-100 dark:bg-red-800/20 px-2 py-1 rounded text-sm font-mono text-red-900 dark:text-red-200">
                {expectedConfirmation}
              </code>
            </div>

            <TextField
              name="confirmation"
              register={register}
              error={errors.confirmation?.message}
              label="Confirmation"
              placeholder=""
              required
            />

            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? 'Deleting Ability...' : 'Delete Ability'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
