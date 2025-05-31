import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/app-dashboard/ui/textarea';
import { Label } from '@/components/app-dashboard/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/app-dashboard/ui/select';
import { Button } from '@/components/shared/ui/button';

interface BaseFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export function TextField({
  label,
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  error,
  type = 'text',
  className,
}: BaseFieldProps & { type?: 'text' | 'email' | 'number' | 'url' }) {
  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function TextAreaField({
  label,
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  error,
  rows = 3,
  className,
}: BaseFieldProps & { rows?: number }) {
  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function SelectField({
  label,
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  error,
  options,
  className,
}: BaseFieldProps & {
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={error ? 'border-red-500' : ''} onBlur={onBlur}>
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
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

interface ArrayFieldProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  addButtonText?: string;
  removeButtonText?: string;
  className?: string;
}

export function ArrayField({
  label,
  values,
  onChange,
  placeholder,
  required,
  error,
  addButtonText = 'Add',
  removeButtonText = 'Remove',
  className,
}: ArrayFieldProps) {
  const updateValue = (index: number, value: string) => {
    const newValues = values.map((v, i) => (i === index ? value : v));
    onChange(newValues);
  };

  const addValue = () => {
    onChange([...values, '']);
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {values.map((value, index) => (
        <div key={index} className="flex gap-2 mt-2">
          <Input
            value={value}
            onChange={(e) => updateValue(index, e.target.value)}
            placeholder={placeholder}
            className={error ? 'border-red-500' : ''}
          />
          {values.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => removeValue(index)} type="button">
              {removeButtonText}
            </Button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addValue} className="mt-2" type="button">
        {addButtonText}
      </Button>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
