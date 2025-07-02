import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Control, Controller } from 'react-hook-form';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  name: string;
  error?: string;
  control: Control<any>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
}

export function SelectField({
  name,
  error,
  control,
  label,
  options,
  placeholder = 'Select an option',
  required = false,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select value={field.value || ''} onValueChange={(value) => field.onChange(value)}>
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
