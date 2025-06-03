import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/shared/ui/button';
import { EntitySelector } from './EntitySelector';

interface FormRendererProps {
  schema: any;
  onSubmit: (data: any) => void | Promise<void>;
  title: string;
  description?: string;
  defaultValues?: any;
  isLoading?: boolean;
  hiddenFields?: string[];
}

export function FormRenderer({
  schema,
  onSubmit,
  title,
  description,
  defaultValues = {},
  isLoading = false,
  hiddenFields = [],
}: FormRendererProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues as any,
    mode: 'onChange',
  });

  const watchedValues = watch();

  const renderField = (key: string, fieldSchema: any) => {
    const error = (errors as any)[key]?.message as string | undefined;

    const metadata = fieldSchema._def.openapi.metadata;

    const placeholder = metadata.description;
    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

    // Special handling for tools field - render as EntitySelector
    if (key === 'tools' && fieldSchema._def.typeName === 'ZodArray') {
      const currentValues = (watchedValues as any)[key] || [];
      return (
        <div key={key} className="mb-4">
          <EntitySelector
            entityType="tool"
            selectedEntities={currentValues}
            onChange={(selected) => setValue(key as any, selected)}
            error={error}
          />
        </div>
      );
    }

    // Handle different zod types
    if (fieldSchema._def.typeName === 'ZodNumber') {
      return (
        <div key={key} className="mb-4">
          <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          <input
            {...register(key as any, { valueAsNumber: true })}
            type="number"
            id={key}
            className={`w-full px-3 py-2 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
            placeholder={placeholder}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
      );
    }

    if (fieldSchema._def.typeName === 'ZodString') {
      // Check for specific validations
      if (fieldSchema._def.checks?.some((check: any) => check.kind === 'email')) {
        return (
          <div key={key} className="mb-4">
            <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              {...register(key as any)}
              type="email"
              id={key}
              className={`w-full px-3 py-2 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
              placeholder={placeholder}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );
      }

      if (fieldSchema._def.checks?.some((check: any) => check.kind === 'url')) {
        return (
          <div key={key} className="mb-4">
            <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              {...register(key as any)}
              type="url"
              id={key}
              className={`w-full px-3 py-2 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
              placeholder={placeholder}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );
      }

      // Regular text input or textarea
      const isLongText =
        key.toLowerCase().includes('description') || key.toLowerCase().includes('changes');

      if (isLongText) {
        return (
          <div key={key} className="mb-4">
            <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <textarea
              {...register(key as any)}
              id={key}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
              placeholder={placeholder}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );
      }

      return (
        <div key={key} className="mb-4">
          <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          <input
            {...register(key as any)}
            type="text"
            id={key}
            className={`w-full px-3 py-2 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
            placeholder={placeholder}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
      );
    }

    if (fieldSchema._def.typeName === 'ZodEnum') {
      const options = fieldSchema._def.values;
      return (
        <div key={key} className="mb-4">
          <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          <select
            {...register(key as any)}
            id={key}
            className={`w-full px-3 py-2 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((option: string) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
      );
    }

    if (fieldSchema._def.typeName === 'ZodArray') {
      const currentValues = (watchedValues as any)[key] || [''];
      const singularLabel = label.slice(0, -1); // Remove 's' from plural

      // Check if array elements should be URLs
      const elementSchema = fieldSchema._def.type;
      const isUrlArray = elementSchema?._def?.checks?.some((check: any) => check.kind === 'url');
      const inputType = isUrlArray ? 'url' : 'text';

      return (
        <div key={key} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          {currentValues.map((value: string, index: number) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type={inputType}
                value={value}
                onChange={(e) => {
                  const newValues = [...currentValues];
                  newValues[index] = e.target.value;
                  (setValue as any)(key, newValues);
                }}
                className={`flex-1 px-3 py-2 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={placeholder || `Enter ${singularLabel.toLowerCase()}`}
              />
              {currentValues.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const newValues = currentValues.filter((_: any, i: number) => i !== index);
                    (setValue as any)(key, newValues);
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => (setValue as any)(key, [...currentValues, ''])}
          >
            Add {singularLabel.toLowerCase()}
          </Button>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
      );
    }

    // Fallback to text input
    return (
      <div key={key} className="mb-4">
        <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <input
          {...register(key as any)}
          type="text"
          id={key}
          className={`w-full px-3 py-2 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
          placeholder={placeholder}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  };

  const schemaShape = (schema as any).shape;

  const handleFormSubmit: SubmitHandler<any> = async (data) => {
    await onSubmit(data);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      {description && <p className="text-gray-600 mb-6">{description}</p>}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {Object.entries(schemaShape)
          .filter(([key]) => !hiddenFields.includes(key))
          .map(([key, fieldSchema]) => renderField(key, fieldSchema))}

        <Button type="submit" disabled={!isValid || isLoading} className="w-full">
          {isLoading ? 'Loading...' : 'Submit'}
        </Button>
      </form>
    </div>
  );
}
