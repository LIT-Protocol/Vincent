import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Control, Controller } from 'react-hook-form';

interface NumberSelectOption {
  value: number;
  label: string;
}

interface NumberSelectFieldProps {
  name: string;
  error?: string;
  control: Control<any>;
  label: string;
  options: NumberSelectOption[];
  placeholder?: string;
  required?: boolean;
}

export function NumberSelectField({
  name,
  error,
  control,
  label,
  options,
  placeholder = 'Select an option',
  required = false,
}: NumberSelectFieldProps) {
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
          <Select
            value={field.value?.toString() || ''}
            onValueChange={(value) => field.onChange(parseInt(value, 10))}
          >
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
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
