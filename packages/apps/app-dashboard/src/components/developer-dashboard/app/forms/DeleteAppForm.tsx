import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent } from '@/components/shared/ui/card';
import { TextField } from '../../form-fields';

function buildConfirmationString(appName: string): string {
  return `I want to delete app ${appName}`;
}

const createDeleteAppSchema = (appName: string) => {
  const expectedConfirmation = buildConfirmationString(appName);
  return z.object({
    confirmation: z.string().refine((val) => val === expectedConfirmation, {
      message: `Please type exactly: "${expectedConfirmation}"`,
    }),
  });
};

export type DeleteAppFormData = {
  confirmation: string;
};

interface DeleteAppFormProps {
  appName: string;
  onSubmit: (data: DeleteAppFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function DeleteAppForm({ appName, onSubmit, isSubmitting = false }: DeleteAppFormProps) {
  const DeleteAppSchema = createDeleteAppSchema(appName);

  const form = useForm<DeleteAppFormData>({
    resolver: zodResolver(DeleteAppSchema),
    defaultValues: {
      confirmation: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = form;

  const expectedConfirmation = buildConfirmationString(appName);

  return (
    <Card className="w-full max-w-2xl mx-auto dark:bg-neutral-800 dark:border-white/10">
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              To confirm deletion, please type the following exactly:
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
              <code className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-sm font-mono text-red-900 dark:text-red-200">
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
              {isSubmitting ? 'Deleting App...' : 'Delete App'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
