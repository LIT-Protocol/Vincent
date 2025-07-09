import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { TextField } from '../../form-fields';
import { AlertTriangle } from 'lucide-react';

//const { toolOwnerDoc } = docSchemas;

//const { authorWalletAddress } = changeOwner.shape;

// FIXME: Fix the registry sdk export, the base schema doesn't seem to be exported
export const ChangeToolOwnerSchema = z
  .object({
    authorWalletAddress: z
      .string()
      .min(1, 'New owner address is required')
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address'),
  })
  .strict();

export type ChangeToolOwnerFormData = z.infer<typeof ChangeToolOwnerSchema>;

interface ChangeToolOwnerFormProps {
  onSubmit: (data: ChangeToolOwnerFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function ChangeToolOwnerForm({ onSubmit, isSubmitting = false }: ChangeToolOwnerFormProps) {
  const form = useForm<ChangeToolOwnerFormData>({
    resolver: zodResolver(ChangeToolOwnerSchema),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const handleFormSubmit = async (data: ChangeToolOwnerFormData) => {
    await onSubmit(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Change Tool Owner</CardTitle>
        <CardDescription>Transfer ownership of this tool to another address</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-1">Warning: This action cannot be undone</p>
              <p>
                Once you transfer ownership, you will no longer be able to manage this tool. The new
                owner will have full control over the tool and its versions.
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <TextField
              name="authorWalletAddress"
              register={register}
              error={errors.authorWalletAddress?.message}
              label="New Owner Address"
              placeholder="0x..."
              required
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Transferring Ownership...' : 'Transfer Ownership'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
