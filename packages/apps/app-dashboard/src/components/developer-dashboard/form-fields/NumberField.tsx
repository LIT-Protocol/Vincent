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
        {...register(name, { valueAsNumber: true })}
        className={error ? 'border-red-500 dark:border-red-400' : ''}
      />
      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
