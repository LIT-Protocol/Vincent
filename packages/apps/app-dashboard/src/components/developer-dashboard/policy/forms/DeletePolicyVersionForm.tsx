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
import { SelectField, TextField } from '../../form-fields';
import { Policy, PolicyVersion } from '@/types/developer-dashboard/appTypes';

function buildConfirmationString(title: string, version: string): string {
  return `I want to delete policy ${title} version ${version}`;
}

const createDeletePolicyVersionSchema = (
  title: string,
  version: string,
  isActiveVersion: boolean,
) => {
  const expectedConfirmation = buildConfirmationString(title, version);
  const baseSchema = z.object({
    confirmation: z.string().refine((val) => val === expectedConfirmation, {
      message: `Please type exactly: "${expectedConfirmation}"`,
    }),
  });

  if (isActiveVersion) {
    return baseSchema.extend({
      activeVersion: z.string(),
    });
  }

  return baseSchema.extend({
    activeVersion: z.string().optional(),
  });
};

export type DeletePolicyVersionFormData = {
  confirmation: string;
  activeVersion?: string;
};

interface DeletePolicyVersionFormProps {
  policy: Policy;
  version: string;
  versions: PolicyVersion[];
  onSubmit: (data: DeletePolicyVersionFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function DeletePolicyVersionForm({
  policy,
  version,
  versions,
  onSubmit,
  isSubmitting = false,
}: DeletePolicyVersionFormProps) {
  const DeletePolicyVersionSchema = createDeletePolicyVersionSchema(
    policy.title || '',
    version,
    version === policy.activeVersion,
  );

  const form = useForm<DeletePolicyVersionFormData>({
    resolver: zodResolver(DeletePolicyVersionSchema),
    defaultValues: {
      confirmation: '',
      ...(version === policy.activeVersion && { activeVersion: undefined }),
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    control,
  } = form;

  const expectedConfirmation = buildConfirmationString(policy.title || '', version);

  // Create version options from policyVersions, showing enabled/disabled status for all versions
  // Filter out the version being deleted since it can't be the new active version
  const versionOptions = versions
    .filter((v) => v.version !== version)
    .map((version) => ({
      value: version.version,
      label: `Version ${version.version}`,
    }));

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-red-600">Delete Policy Version</CardTitle>
        <CardDescription>
          Please make sure you're absolutely certain you want to delete this policy version.
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

            {version === policy.activeVersion && (
              <div className="space-y-4">
                <div className="text-sm text-red-500">
                  This is the active version of the policy. Please choose a new active version
                  before deleting this one.
                </div>
                <SelectField
                  name="activeVersion"
                  error={errors.activeVersion?.message}
                  control={control}
                  label="New Active Version"
                  options={versionOptions}
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? 'Deleting Policy Version...' : 'Delete Policy Version'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
