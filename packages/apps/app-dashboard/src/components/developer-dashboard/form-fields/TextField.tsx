import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { UseFormRegister } from 'react-hook-form';

interface TextFieldProps {
  name: string;
  register: UseFormRegister<any>;
  error?: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}

export function TextField({
  name,
  register,
  error,
  label,
  placeholder,
  required = false,
}: TextFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type="text"
        placeholder={placeholder}
        {...register(name)}
        className={error ? 'border-red-500 dark:border-red-400' : ''}
      />
      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
