import { Control } from 'react-hook-form';
import { SelectField } from '..';

const deploymentStatusOptions = [
  { value: 'dev', label: 'Development' },
  { value: 'test', label: 'Test' },
  { value: 'prod', label: 'Production' },
];

export function DeploymentStatusSelectField({
  error,
  control,
}: {
  error?: string;
  control: Control<any>;
}) {
  return (
    <SelectField
      name="deploymentStatus"
      error={error}
      control={control}
      label="Deployment Status"
      options={deploymentStatusOptions}
      required
    />
  );
}
