import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent } from '@/components/shared/ui/card';
import { SelectField, TextField } from '../../form-fields';
import { Ability, AbilityVersion } from '@/types/developer-dashboard/appTypes';

function buildConfirmationString(title: string, version: string): string {
  return `I want to delete ability ${title} version ${version}`;
}

const createDeleteAbilityVersionSchema = (
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

export type DeleteAbilityVersionFormData = {
  confirmation: string;
  activeVersion?: string;
};

interface DeleteAbilityVersionFormProps {
  ability: Ability;
  version: string;
  versions: AbilityVersion[];
  onSubmit: (data: DeleteAbilityVersionFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function DeleteAbilityVersionForm({
  ability,
  version,
  versions,
  onSubmit,
  isSubmitting = false,
}: DeleteAbilityVersionFormProps) {
  const DeleteAbilityVersionSchema = createDeleteAbilityVersionSchema(
    ability.title || '',
    version,
    version === ability.activeVersion,
  );

  const form = useForm<DeleteAbilityVersionFormData>({
    resolver: zodResolver(DeleteAbilityVersionSchema),
    defaultValues: {
      confirmation: '',
      ...(version === ability.activeVersion && { activeVersion: undefined }),
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    control,
  } = form;

  const expectedConfirmation = buildConfirmationString(ability.title || '', version);

  // Create version options from policyVersions, showing enabled/disabled status for all versions
  // Filter out the version being deleted since it can't be the new active version
  const versionOptions = versions
    .filter((v) => v.version !== version)
    .map((version) => ({
      value: version.version,
      label: `Version ${version.version}`,
    }));

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

            {version === ability.activeVersion && (
              <div className="space-y-4">
                <div className="text-sm text-red-500 dark:text-red-400">
                  This is the active version of the ability. Please choose a new active version
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
              {isSubmitting ? 'Deleting Ability Version...' : 'Delete Ability Version'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
