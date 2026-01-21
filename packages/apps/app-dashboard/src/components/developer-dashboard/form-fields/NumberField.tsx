import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { UseFormRegister } from 'react-hook-form';

interface NumberFieldProps {
  name: string;
  register: UseFormRegister<any>;
  error?: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  disabled?: boolean;
  helperText?: string;
}

export function NumberField({
  name,
  register,
  error,
  label,
  placeholder,
  required = false,
  min,
  max,
  disabled = false,
  helperText,
}: NumberFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type="number"
        placeholder={placeholder}
        min={min}
        max={max}
        disabled={disabled}
        {...register(name, { valueAsNumber: true })}
        className={error ? 'border-red-500 dark:border-red-400' : ''}
      />
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
