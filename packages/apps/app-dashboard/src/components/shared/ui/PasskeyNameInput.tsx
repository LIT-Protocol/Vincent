import * as React from 'react';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { cn } from '@/lib/utils';

interface PasskeyNameInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export function PasskeyNameInput({
  value,
  onChange,
  placeholder = 'Vincent Passkey',
  error,
  required = false,
  className,
  disabled = false,
  label = 'Passkey name',
  description = 'Give your passkey a memorable name to help you identify it later',
}: PasskeyNameInputProps) {
  const inputId = React.useId();
  const descriptionId = React.useId();
  const errorId = React.useId();

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={inputId}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}

      <Input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-describedby={description ? descriptionId : undefined}
        aria-invalid={!!error}
        aria-errormessage={error ? errorId : undefined}
        className={cn(error && 'border-red-500 focus-visible:border-red-500', className)}
      />

      {error && (
        <p id={errorId} className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
