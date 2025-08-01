import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import { AppVersionAbility, Policy } from '@/types/developer-dashboard/appTypes';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { PolicyCheckboxField } from '../../form-fields';

const { appVersionAbilityDoc } = docSchemas;

const { hiddenSupportedPolicies } = appVersionAbilityDoc.shape;

export const EditAppVersionAbilitySchema = z
  .object({
    hiddenSupportedPolicies,
  })
  .required()
  .strict();

export type EditAppVersionAbilityFormData = z.infer<typeof EditAppVersionAbilitySchema>;

interface EditAppVersionAbilityFormProps {
  ability: AppVersionAbility;
  policies: Policy[];
  onSubmit: (data: EditAppVersionAbilityFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function EditAppVersionAbilityForm({
  ability,
  policies,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EditAppVersionAbilityFormProps) {
  const form = useForm<EditAppVersionAbilityFormData>({
    resolver: zodResolver(EditAppVersionAbilitySchema),
    defaultValues: {
      hiddenSupportedPolicies: ability.hiddenSupportedPolicies || [],
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PolicyCheckboxField
          name="hiddenSupportedPolicies"
          error={errors.hiddenSupportedPolicies?.message}
          watch={watch}
          setValue={setValue}
          label="Hidden Supported Policies"
          policies={policies}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
