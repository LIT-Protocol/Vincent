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
import { TextField } from '../../form-fields';
import { AlertTriangle } from 'lucide-react';

//const { policyOwnerDoc } = docSchemas;

//const { authorWalletAddress } = changeOwner.shape;

// FIXME: Fix the registry sdk export. It's now exported, but we need .min(1) and .regex
export const ChangePolicyOwnerSchema = z
  .object({
    authorWalletAddress: z
      .string()
      .min(1, 'New owner address is required')
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address'),
  })
  .strict();

export type ChangePolicyOwnerFormData = z.infer<typeof ChangePolicyOwnerSchema>;

interface ChangePolicyOwnerFormProps {
  onSubmit: (data: ChangePolicyOwnerFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function ChangePolicyOwnerForm({
  onSubmit,
  isSubmitting = false,
}: ChangePolicyOwnerFormProps) {
  const form = useForm<ChangePolicyOwnerFormData>({
    resolver: zodResolver(ChangePolicyOwnerSchema),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const handleFormSubmit = async (data: ChangePolicyOwnerFormData) => {
    await onSubmit(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto dark:bg-neutral-800 dark:border-white/10">
      <CardHeader>
        <CardTitle className="text-neutral-800 dark:text-white">Change Policy Owner</CardTitle>
        <CardDescription className="text-gray-600 dark:text-white/60">
          Transfer ownership of this policy to another address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800 dark:text-orange-200">
              <p className="font-medium mb-1">Warning: This action cannot be undone</p>
              <p>
                Once you transfer ownership, you will no longer be able to manage this policy. The
                new owner will have full control over the policy and its versions.
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
