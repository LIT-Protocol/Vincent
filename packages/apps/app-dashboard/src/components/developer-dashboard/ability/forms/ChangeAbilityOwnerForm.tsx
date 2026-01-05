import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Form } from '@/components/shared/ui/form';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { TextField } from '../../form-fields';
import { theme, fonts } from '@/lib/themeClasses';
import { extractErrorMessage } from '@/utils/developer-dashboard/app-forms';

//const { abilityOwnerDoc } = docSchemas;

//const { authorWalletAddress } = changeOwner.shape;

// FIXME: Fix the registry sdk export, the base schema doesn't seem to be exported
export const ChangeAbilityOwnerSchema = z
  .object({
    authorWalletAddress: z
      .string()
      .min(1, 'New owner address is required')
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address'),
  })
  .strict();

export type ChangeAbilityOwnerFormData = z.infer<typeof ChangeAbilityOwnerSchema>;

interface ChangeAbilityOwnerFormProps {
  onSubmit: (data: ChangeAbilityOwnerFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function ChangeAbilityOwnerForm({
  onSubmit,
  isSubmitting = false,
}: ChangeAbilityOwnerFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<ChangeAbilityOwnerFormData>({
    resolver: zodResolver(ChangeAbilityOwnerSchema),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const handleFormSubmit = async (data: ChangeAbilityOwnerFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await onSubmit(data);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Failed to change ability owner:', error);
      setSubmitError(extractErrorMessage(error, 'Failed to change ability owner'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="space-y-6">
          {/* Warning Message */}
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800 dark:text-orange-200">
                <p className="font-semibold mb-1" style={fonts.heading}>
                  Warning: This action cannot be undone
                </p>
                <p style={fonts.body}>
                  Once you transfer ownership, you will no longer be able to manage this ability.
                  The new owner will have full control over the ability and its versions.
                </p>
              </div>
            </div>
          </div>

          <TextField
            name="authorWalletAddress"
            register={register}
            error={errors.authorWalletAddress?.message}
            label="New Owner Address"
            placeholder="0x..."
            required
          />

          {/* Status Messages */}
          {submitError && <StatusMessage message={submitError} type="error" />}
          {submitSuccess && (
            <StatusMessage message="Ability owner changed successfully!" type="success" />
          )}

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              className="w-full"
              style={{ backgroundColor: theme.brandOrange }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Transferring Ownership...' : 'Transfer Ownership'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
