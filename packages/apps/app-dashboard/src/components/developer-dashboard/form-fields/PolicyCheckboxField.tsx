import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Policy } from '@/types/developer-dashboard/appTypes';

interface PolicyCheckboxFieldProps {
  name: string;
  error?: string;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  label: string;
  required?: boolean;
  policies: Policy[];
}

export function PolicyCheckboxField({
  name,
  error,
  watch,
  setValue,
  label,
  required = false,
  policies,
}: PolicyCheckboxFieldProps) {
  const currentValues = watch(name) || [];

  const handleCheckboxChange = (policyPackageName: string, checked: boolean) => {
    let newValues: string[];
    if (checked) {
      newValues = currentValues.includes(policyPackageName)
        ? currentValues
        : [...currentValues, policyPackageName];
    } else {
      newValues = currentValues.filter((value: string) => value !== policyPackageName);
    }
    setValue(name, newValues);
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {policies.length === 0 ? (
        <div className="text-sm text-gray-500">No policies available</div>
      ) : (
        <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-3">
          {policies.map((policy) => (
            <div key={policy.packageName} className="flex items-start space-x-3">
              <Checkbox
                id={`${name}-${policy.packageName}`}
                checked={currentValues.includes(policy.packageName)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(policy.packageName, checked as boolean)
                }
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor={`${name}-${policy.packageName}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {policy.title}
                </label>
                <p className="text-xs text-muted-foreground">{policy.packageName}</p>
                {policy.description && (
                  <p className="text-xs text-muted-foreground">{policy.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {currentValues.length > 0 && (
        <div className="text-sm text-gray-600">
          Selected: {currentValues.length} of {policies.length} policies
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
