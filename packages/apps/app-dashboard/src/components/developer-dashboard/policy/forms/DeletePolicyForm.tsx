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
import { TextField } from '../../form-fields';

function buildConfirmationString(title: string): string {
  return `I want to delete policy ${title}`;
}

const createDeletePolicySchema = (title: string) => {
  const expectedConfirmation = buildConfirmationString(title);
  return z.object({
    confirmation: z.string().refine((val) => val === expectedConfirmation, {
      message: `Please type exactly: "${expectedConfirmation}"`,
    }),
  });
};

export type DeletePolicyFormData = {
  confirmation: string;
};

interface DeletePolicyFormProps {
  title: string;
  onSubmit: (data: DeletePolicyFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function DeletePolicyForm({ title, onSubmit, isSubmitting = false }: DeletePolicyFormProps) {
  const DeletePolicySchema = createDeletePolicySchema(title);

  const form = useForm<DeletePolicyFormData>({
    resolver: zodResolver(DeletePolicySchema),
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-red-600">Delete Policy</CardTitle>
        <CardDescription>
          Please make sure you're absolutely certain you want to delete this policy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 mb-2">
                To confirm deletion, please type the following exactly:
              </p>
              <code className="bg-red-100 px-2 py-1 rounded text-sm font-mono text-red-900">
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
              {isSubmitting ? 'Deleting Policy...' : 'Delete Policy'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
