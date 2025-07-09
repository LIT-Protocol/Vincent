import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { AppVersionTool, Policy } from '@/types/developer-dashboard/appTypes';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { PolicyCheckboxField } from '../../form-fields';

const { appVersionToolDoc } = docSchemas;

const { hiddenSupportedPolicies } = appVersionToolDoc.shape;

export const EditAppVersionToolSchema = z
  .object({
    hiddenSupportedPolicies,
  })
  .required()
  .strict();

export type EditAppVersionToolFormData = z.infer<typeof EditAppVersionToolSchema>;

interface EditAppVersionToolFormProps {
  tool: AppVersionTool;
  policies: Policy[];
  onSubmit: (data: EditAppVersionToolFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function EditAppVersionToolForm({
  tool,
  policies,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EditAppVersionToolFormProps) {
  const form = useForm<EditAppVersionToolFormData>({
    resolver: zodResolver(EditAppVersionToolSchema),
    defaultValues: {
      hiddenSupportedPolicies: tool.hiddenSupportedPolicies || [],
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
