import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';

interface NumberSelectOption {
  value: number;
  label: string;
}

interface NumberSelectFieldProps {
  name: string;
  error?: string;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  label: string;
  options: NumberSelectOption[];
  placeholder?: string;
  required?: boolean;
}

export function NumberSelectField({
  name,
  error,
  watch,
  setValue,
  label,
  options,
  placeholder = 'Select an option',
  required = false,
}: NumberSelectFieldProps) {
  const currentValue = watch(name);

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select
        value={currentValue?.toString() || ''}
        onValueChange={(value) => setValue(name, parseInt(value, 10))}
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
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
