import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { SelectField } from '..';

const deploymentStatusOptions = [
  { value: 'dev', label: 'Development' },
  { value: 'test', label: 'Test' },
  { value: 'prod', label: 'Production' },
];

export function DeploymentStatusSelectField({
  error,
  watch,
  setValue,
}: {
  error?: string;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}) {
  return (
    <SelectField
      name="deploymentStatus"
      error={error}
      watch={watch}
      setValue={setValue}
      label="Deployment Status"
      options={deploymentStatusOptions}
      required
    />
  );
}
