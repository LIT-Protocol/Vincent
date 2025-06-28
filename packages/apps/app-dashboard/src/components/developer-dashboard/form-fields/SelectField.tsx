import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  name: string;
  error?: string;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
}

export function SelectField({
  name,
  error,
  watch,
  setValue,
  label,
  options,
  placeholder = 'Select an option',
  required = false,
}: SelectFieldProps) {
  const currentValue = watch(name);

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select value={currentValue || ''} onValueChange={(value) => setValue(name, value)}>
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
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
