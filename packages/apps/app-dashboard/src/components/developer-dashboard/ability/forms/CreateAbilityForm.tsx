import { z } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { Form } from '@/components/shared/ui/form';
import { Button } from '@/components/shared/ui/button';
import { TextField, LongTextField, ImageUploadField } from '../../form-fields';
import { DeploymentStatusSelectField } from '../../form-fields/array/DeploymentStatusSelectField';
import { extractErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { theme, fonts } from '@/lib/themeClasses';

const { abilityDoc } = docSchemas;

const { packageName, description, title, logo, activeVersion, deploymentStatus } = abilityDoc.shape;

export const CreateAbilitySchema = z
  .object({ packageName, description, title, logo, activeVersion, deploymentStatus })
  .strict();

export type CreateAbilityFormData = z.infer<typeof CreateAbilitySchema>;

interface CreateAbilityFormProps {
  onSubmit: (data: CreateAbilityFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateAbilityForm({ onSubmit, isSubmitting = false }: CreateAbilityFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<CreateAbilityFormData>({
    resolver: zodResolver(CreateAbilitySchema),
    defaultValues: {
      deploymentStatus: 'dev',
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
    control,
  } = form;

  const handleFormSubmit = async (data: CreateAbilityFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await onSubmit(data);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Failed to create ability:', error);
      setSubmitError(extractErrorMessage(error, 'Failed to create ability'));
    }
  };

  return (
    <div className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}>
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="space-y-8">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 items-start">
                {/* Left Column */}
                <div>
                  <h3 className={`text-sm font-semibold mb-4 ${theme.text}`} style={fonts.heading}>
                    Basic Information
                  </h3>
                  <div className="space-y-6">
                    <TextField
                      name="packageName"
                      register={register}
                      error={errors.packageName?.message}
                      label="Package Name"
                      placeholder="@lit-protocol/vincent-ability"
                      required
                    />

                    <TextField
                      name="title"
                      register={register}
                      error={errors.title?.message}
                      label="Title"
                      placeholder="Enter ability title (user-readable)"
                      required
                    />

                    <LongTextField
                      name="description"
                      register={register}
                      error={errors.description?.message}
                      label="Description"
                      placeholder="Describe your ability"
                      rows={4}
                      required
                    />

                    <TextField
                      name="activeVersion"
                      register={register}
                      error={errors.activeVersion?.message}
                      label="Active Version"
                      placeholder="1.0.0"
                      required
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <h3 className={`text-sm font-semibold mb-4 ${theme.text}`} style={fonts.heading}>
                    Configuration
                  </h3>
                  <div className="space-y-6">
                    <ImageUploadField
                      name="logo"
                      watch={watch}
                      setValue={setValue}
                      control={control}
                      setError={setError}
                      clearErrors={clearErrors}
                      label="Logo"
                    />

                    <DeploymentStatusSelectField
                      error={errors.deploymentStatus?.message}
                      control={control}
                    />
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {submitError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-600 dark:text-red-400">{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Ability created successfully!
                  </span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                style={{ backgroundColor: theme.brandOrange }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Ability...' : 'Create Ability'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
