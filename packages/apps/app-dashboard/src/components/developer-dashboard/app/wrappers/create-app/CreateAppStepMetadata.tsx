import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/shared/ui/button';
import { Form } from '@/components/shared/ui/form';
import { theme, fonts } from '@/lib/themeClasses';
import {
  TextField,
  LongTextField,
  ImageUploadField,
  DeploymentStatusSelectField,
} from '@/components/developer-dashboard/form-fields';
import { AppMetadataFormData } from './useCreateAppFormState';

interface CreateAppStepMetadataProps {
  metadataForm: UseFormReturn<AppMetadataFormData>;
  onNext: (data: AppMetadataFormData) => void;
  onBack: () => void;
}

export function CreateAppStepMetadata({
  metadataForm,
  onNext,
  onBack,
}: CreateAppStepMetadataProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    setError,
    clearErrors,
    formState: { errors },
  } = metadataForm;

  return (
    <div className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl p-6`}>
      <p className={`${theme.textMuted} text-sm mb-6`} style={fonts.body}>
        Provide metadata for your app and version 1. This information will be stored in the Vincent
        Registry.
      </p>

      <Form {...metadataForm}>
        <form onSubmit={handleSubmit(onNext)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 items-start">
            {/* Left Column - Basic Information */}
            <div>
              <h3 className={`text-sm font-semibold mb-4 ${theme.text}`} style={fonts.heading}>
                Basic Information
              </h3>
              <div className="space-y-6">
                <TextField
                  name="name"
                  register={register}
                  error={errors.name?.message}
                  label="App Name"
                  placeholder="Enter app name"
                  required
                />

                <TextField
                  name="contactEmail"
                  register={register}
                  error={errors.contactEmail?.message}
                  label="Contact Email"
                  placeholder="contact@example.com"
                  required
                />

                <LongTextField
                  name="description"
                  register={register}
                  error={errors.description?.message}
                  label="Description"
                  placeholder="Describe your application"
                  rows={4}
                  required
                />

                <TextField
                  name="appUrl"
                  register={register}
                  error={errors.appUrl?.message}
                  label="App URL"
                  placeholder="https://yourapp.com"
                  required
                />
              </div>
            </div>

            {/* Right Column - Configuration */}
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

          <div className="mt-6 flex justify-between">
            <Button type="button" onClick={onBack} variant="outline">
              Back
            </Button>
            <Button
              type="submit"
              className="text-white px-8"
              style={{ backgroundColor: theme.brandOrange, ...fonts.heading }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.brandOrange;
              }}
            >
              Next: Review
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
