import { useState, useMemo, useCallback } from 'react';
import { z } from 'zod';
import { ValidationRule } from './types';
import { VALIDATION_MESSAGES, validateWithSchema } from './validation';

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: Partial<Record<keyof T, ValidationRule<T[keyof T]> | z.ZodSchema<T[keyof T]>>>,
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback(
    (name: keyof T, value: T[keyof T]): string | undefined => {
      const rule = validationRules?.[name];
      if (!rule) return undefined;

      // Check if it's a Zod schema
      if (rule && typeof rule === 'object' && '_def' in rule) {
        const zodSchema = rule as z.ZodSchema<T[keyof T]>;
        return validateWithSchema(zodSchema, value);
      }

      // Legacy validation rule handling
      const validationRule = rule as ValidationRule<T[keyof T]>;
      if (
        validationRule.required &&
        (value == null || (typeof value === 'string' && value.trim() === ''))
      ) {
        return validationRule.message || VALIDATION_MESSAGES.REQUIRED;
      }

      if (typeof value === 'string') {
        if (validationRule.minLength && value.length < validationRule.minLength) {
          return validationRule.message || VALIDATION_MESSAGES.MIN_LENGTH(validationRule.minLength);
        }

        if (validationRule.maxLength && value.length > validationRule.maxLength) {
          return validationRule.message || VALIDATION_MESSAGES.MAX_LENGTH(validationRule.maxLength);
        }

        if (validationRule.pattern && !validationRule.pattern.test(value)) {
          return validationRule.message || 'Invalid format';
        }
      }

      if (validationRule.custom) {
        return validationRule.custom(value);
      }

      return undefined;
    },
    [validationRules],
  );

  const setValue = useCallback(
    (name: keyof T, value: T[keyof T]) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Validate on change if field has been touched
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [touched, validateField],
  );

  const setFieldTouched = useCallback(
    (name: keyof T) => {
      setTouched((prev) => ({ ...prev, [name]: true }));

      // Validate on blur
      const error = validateField(name, values[name]);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [values, validateField],
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let hasErrors = false;

    for (const name in values) {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        hasErrors = true;
      }
    }

    setErrors(newErrors);
    setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    return !hasErrors;
  }, [values, validateField]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = useMemo(() => {
    return Object.values(errors).every((error) => !error);
  }, [errors]);

  const isDirty = useMemo(() => {
    return Object.keys(values).some((key) => values[key] !== initialValues[key]);
  }, [values, initialValues]);

  const getFieldProps = useCallback(
    (name: keyof T) => ({
      value: values[name],
      error: errors[name],
      touched: touched[name],
      onChange: (value: T[keyof T]) => setValue(name, value),
      onBlur: () => setFieldTouched(name),
    }),
    [values, errors, touched, setValue, setFieldTouched],
  );

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateAll,
    reset,
    isValid,
    isDirty,
    getFieldProps,
  };
}

export function useAsyncForm<TRequest, TResponse>(
  submitFn: (data: TRequest) => Promise<TResponse>,
) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (data: TRequest): Promise<TResponse> => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await submitFn(data);
      setResult(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    submit,
    isLoading,
    result,
    error,
    clearResult,
  };
}
