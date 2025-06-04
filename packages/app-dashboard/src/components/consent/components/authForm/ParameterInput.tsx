import { useState, useEffect, useCallback } from 'react';
import { ParameterType, mapEnumToTypeName } from '../../../../services/types/parameterTypes';
import { z } from 'zod';
import { Button } from '@/components/ui/button';

// Define Zod schemas for different parameter types
const zodSchemas: Record<number, z.ZodTypeAny> = {
  // Basic types
  [ParameterType.INT256]: z
    .union([
      z.string().refine((val) => val === '' || val === '-' || !isNaN(parseInt(val)), {
        message: 'Must be a valid integer or empty',
      }),
      z.number().int(),
      z.literal(''),
    ])
    .optional(),

  [ParameterType.UINT256]: z
    .union([
      z.string().refine((val) => val === '' || (!isNaN(parseInt(val)) && parseInt(val) >= 0), {
        message: 'Must be a non-negative integer or empty',
      }),
      z.number().int().nonnegative(),
      z.literal(''),
    ])
    .optional(),

  [ParameterType.BOOL]: z
    .union([z.boolean(), z.literal(''), z.enum(['true', 'false', 'not_set'])])
    .optional(),

  [ParameterType.ADDRESS]: z
    .union([
      z.string().regex(/^(0x[a-fA-F0-9]{40}|0x\.\.\.|)$/, {
        message: 'Must be a valid Ethereum address, 0x..., or empty',
      }),
      z.literal(''),
    ])
    .optional(),

  [ParameterType.STRING]: z.string().optional(),

  // Array types
  [ParameterType.INT256_ARRAY]: z
    .union([
      z.string().refine(
        (val) => {
          if (val === '') return true;
          return val.split(',').every((item) => {
            const trimmed = item.trim();
            return trimmed === '' || trimmed === '-' || !isNaN(parseInt(trimmed));
          });
        },
        {
          message: 'Must be comma-separated integers or empty',
        },
      ),
      z.array(z.union([z.number().int(), z.string(), z.literal('')])),
      z.literal(''),
    ])
    .optional(),

  [ParameterType.UINT256_ARRAY]: z
    .union([
      z.string().refine(
        (val) => {
          if (val === '') return true;
          return val.split(',').every((item) => {
            const trimmed = item.trim();
            return trimmed === '' || (!isNaN(parseInt(trimmed)) && parseInt(trimmed) >= 0);
          });
        },
        {
          message: 'Must be comma-separated non-negative integers or empty',
        },
      ),
      z.array(z.union([z.number().int().nonnegative(), z.string(), z.literal('')])),
      z.literal(''),
    ])
    .optional(),

  [ParameterType.BOOL_ARRAY]: z
    .union([
      z.string().refine(
        (val) => {
          if (val === '') return true;
          return val.split(',').every((item) => {
            const trimmed = item.trim().toLowerCase();
            return (
              trimmed === '' || ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(trimmed)
            );
          });
        },
        {
          message: 'Must be comma-separated boolean values or empty',
        },
      ),
      z.array(z.union([z.boolean(), z.string(), z.literal('')])),
      z.literal(''),
    ])
    .optional(),

  [ParameterType.ADDRESS_ARRAY]: z
    .union([
      z.string().refine(
        (val) => {
          if (val === '') return true;
          return val.split(',').every((item) => {
            const trimmed = item.trim();
            return trimmed === '' || trimmed === '0x...' || /^0x[a-fA-F0-9]{40}$/.test(trimmed);
          });
        },
        {
          message: 'Must be comma-separated Ethereum addresses or empty',
        },
      ),
      z.array(z.string()),
      z.literal(''),
    ])
    .optional(),

  [ParameterType.STRING_ARRAY]: z
    .union([z.string(), z.array(z.string()), z.literal('')])
    .optional(),
};

interface ParameterInputProps {
  name: string;
  type: number;
  onChange: (value: any) => void;
  value?: any;
}

export default function ParameterInput({ name, type, onChange, value }: ParameterInputProps) {
  const [inputValue, setInputValue] = useState<any>(value || '');
  const [error, setError] = useState<string | null>(null);
  const typeName = mapEnumToTypeName(type);

  const schema = zodSchemas[type] || z.any();

  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setInputValue(value);
      validateValue(value);
    }
  }, [value]);

  const validateValue = useCallback(
    (val: any) => {
      try {
        schema.parse(val);
        setError(null);
        return true;
      } catch (err) {
        if (err instanceof z.ZodError) {
          setError(err.errors[0]?.message || 'Invalid value');
        } else {
          setError('Invalid value');
        }
        return false;
      }
    },
    [schema],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      // Validate the new value
      if (validateValue(newValue)) {
        // Convert value based on type
        let parsedValue: any;
        switch (type) {
          case ParameterType.INT256:
            // Special case for just typing a minus sign
            if (newValue === '-') {
              parsedValue = newValue;
            } else if (newValue === '') {
              parsedValue = '';
            } else {
              try {
                // Keep as string but validate by parsing (don't assign the parsed number)
                const num = parseInt(newValue, 10);
                parsedValue = isNaN(num) ? '' : newValue;
              } catch (e) {
                parsedValue = '';
              }
            }
            break;
          case ParameterType.UINT256:
            if (newValue === '') {
              parsedValue = ''; // Keep empty string
            } else {
              try {
                parsedValue = parseInt(newValue, 10);
                parsedValue = isNaN(parsedValue) ? '' : Math.max(0, parsedValue);
              } catch (e) {
                parsedValue = '';
              }
            }
            break;
          case ParameterType.BOOL:
            if (newValue === 'not_set' || newValue === '') {
              parsedValue = '';
            } else {
              parsedValue = newValue === 'true';
            }
            break;
          case ParameterType.INT256_ARRAY:
            if (newValue === '') {
              parsedValue = '';
            } else {
              parsedValue = newValue.split(',').map((v) => {
                const trimmed = v.trim();
                if (trimmed === '' || trimmed === '-') return trimmed;

                const num = parseInt(trimmed, 10);
                return isNaN(num) ? '' : num;
              });
            }
            break;
          case ParameterType.UINT256_ARRAY:
            if (newValue === '') {
              parsedValue = ''; // Keep empty string for empty array
            } else {
              parsedValue = newValue.split(',').map((v) => {
                const trimmed = v.trim();
                if (trimmed === '') return trimmed;

                const num = parseInt(trimmed, 10);
                return isNaN(num) ? '' : Math.max(0, num);
              });
            }
            break;
          case ParameterType.BOOL_ARRAY:
            if (newValue === '') {
              parsedValue = ''; // Keep empty string for empty array
            } else {
              parsedValue = newValue.split(',').map((v) => {
                const trimmed = v.trim().toLowerCase();
                if (trimmed === '') return '';

                return ['true', '1', 'yes', 'y', 'on'].includes(trimmed);
              });
            }
            break;
          case ParameterType.STRING_ARRAY:
            if (newValue === '') {
              parsedValue = ''; // Keep empty string for empty array
              parsedValue = newValue.split(',').map((v) => v.trim());
            }
            break;
          case ParameterType.ADDRESS_ARRAY:
            if (newValue === '') {
              parsedValue = ''; // Keep empty string for empty array
            } else {
              // Get cleaned array of addresses
              parsedValue = newValue.split(',').map((v) => v.trim());
            }
            break;
          case ParameterType.STRING:
            // Strings can use as-is
            parsedValue = newValue;
            break;
          case ParameterType.ADDRESS:
            // Addresses should be trimmed
            parsedValue = newValue.trim();
            break;
          default:
            parsedValue = newValue;
        }

        onChange(parsedValue);
      }
    },
    [type, onChange, validateValue],
  );

  // Add these helper functions for array manipulation
  const addArrayItem = (defaultValue: any = '') => {
    // Get current array or initialize empty array
    let currentArray: any[] = [];

    if (Array.isArray(inputValue)) {
      currentArray = [...inputValue];
    } else if (typeof inputValue === 'string') {
      if (inputValue.length > 0) {
        currentArray = inputValue.split(',').map((v) => v.trim());
      }
    } else if (inputValue === null || inputValue === undefined) {
      // Initialize as empty array
    } else {
      // Handle any unexpected type by using empty array
      console.warn('Unexpected inputValue type:', typeof inputValue);
    }

    if (type === ParameterType.INT256_ARRAY || type === ParameterType.UINT256_ARRAY) {
      defaultValue = ''; // Use empty string instead of 0 for numeric arrays
    }

    // Add the new item
    currentArray.push(defaultValue);

    // Store the array value directly for rendering
    setInputValue(currentArray);

    // Pass to parent
    if (validateValue(currentArray)) {
      onChange(currentArray);
    }
  };

  const removeArrayItem = (index: number) => {
    // Get current array or initialize empty array
    let currentArray: any[] = [];

    if (Array.isArray(inputValue)) {
      currentArray = [...inputValue];
    } else if (typeof inputValue === 'string') {
      if (inputValue.length > 0) {
        currentArray = inputValue.split(',').map((v) => v.trim());
      }
    }

    // Remove the item at the specified index
    if (index >= 0 && index < currentArray.length) {
      currentArray.splice(index, 1);

      // Store the array value directly for rendering
      setInputValue(currentArray);

      if (validateValue(currentArray)) {
        // Remove only empty values from end of array
        const trimmedArray = [...currentArray];
        while (trimmedArray.length > 0 && trimmedArray[trimmedArray.length - 1] === '') {
          trimmedArray.pop();
        }

        // If all elements were removed or only empty elements remain, return empty string
        if (trimmedArray.length === 0) {
          onChange('');
        } else {
          onChange(trimmedArray);
        }
      }
    }
  };

  const updateArrayItem = (index: number, value: any) => {
    // Get current array or initialize empty array
    let currentArray: any[] = [];

    if (Array.isArray(inputValue)) {
      currentArray = [...inputValue];
    } else if (typeof inputValue === 'string') {
      if (inputValue.length > 0) {
        currentArray = inputValue.split(',').map((v) => v.trim());
      }
    }

    // Update the value at the specified index
    if (index >= 0 && index < currentArray.length) {
      currentArray[index] = value;

      // Store the array value directly for rendering
      setInputValue(currentArray);

      // Pass to parent
      if (validateValue(currentArray)) {
        // Remove only empty values from end of array
        const trimmedArray = [...currentArray];
        while (trimmedArray.length > 0 && trimmedArray[trimmedArray.length - 1] === '') {
          trimmedArray.pop();
        }

        onChange(trimmedArray.length > 0 ? trimmedArray : '');
      }
    }
  };

  // Render array input fields dynamically
  const renderArrayFields = (arrayType: ParameterType) => {
    // Parse the current value into an array
    const currentArray = Array.isArray(inputValue)
      ? [...inputValue]
      : typeof inputValue === 'string' && inputValue.length > 0
        ? inputValue.split(',').map((v) => v.trim())
        : [];

    // Get the appropriate input type based on the array type
    let inputType = 'text';
    let placeholder = '';
    let defaultValue: any = '';

    switch (arrayType) {
      case ParameterType.INT256_ARRAY:
        inputType = 'number';
        placeholder = 'Enter an integer';
        defaultValue = '';
        break;
      case ParameterType.UINT256_ARRAY:
        inputType = 'number';
        placeholder = 'Enter a non-negative integer';
        defaultValue = '';
        break;
      case ParameterType.BOOL_ARRAY:
        inputType = 'checkbox';
        placeholder = '';
        defaultValue = false;
        break;
      case ParameterType.ADDRESS_ARRAY:
        inputType = 'text';
        placeholder = '0x...';
        defaultValue = '';
        break;
      case ParameterType.STRING_ARRAY:
        inputType = 'text';
        placeholder = 'Enter a string';
        defaultValue = '';
        break;
    }

    return (
      <div className="array-inputs font-sans">
        {currentArray.length === 0 ? (
          <div className="empty-array-message text-sm text-gray-500 p-2 text-center bg-gray-50 rounded-lg">
            No items added yet
          </div>
        ) : (
          <div className="space-y-2">
            {currentArray.map((item, index) => (
              <div
                key={index}
                className="array-item border border-gray-200 rounded-lg flex items-center overflow-hidden"
              >
                <div className="flex-grow px-2 py-1">
                  {arrayType === ParameterType.BOOL_ARRAY ? (
                    <div className="bool-array-item flex items-center">
                      <input
                        type="checkbox"
                        checked={item === true || item === 'true'}
                        onChange={(e) => updateArrayItem(index, e.target.checked)}
                        className="mr-2"
                      />
                      <span className="bool-array-item-label text-sm text-gray-700">
                        Item {index + 1}: {item === true || item === 'true' ? 'True' : 'False'}
                      </span>
                    </div>
                  ) : (
                    <input
                      type={inputType}
                      value={item}
                      min={arrayType === ParameterType.UINT256_ARRAY ? '0' : undefined}
                      placeholder={placeholder}
                      onChange={(e) => updateArrayItem(index, e.target.value)}
                      onKeyDown={
                        arrayType === ParameterType.UINT256_ARRAY
                          ? (e) => {
                              if (e.key === '-' || e.key === 'e') {
                                e.preventDefault();
                              }
                            }
                          : undefined
                      }
                      className="array-item-input w-full px-2 py-1 text-sm border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded text-gray-700"
                    />
                  )}
                </div>
                <Button
                  onClick={() => removeArrayItem(index)}
                  className="array-item-remove-btn flex-shrink-0 h-full px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                  aria-label="Remove item"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="array-actions mt-3">
          <Button
            className="parameter-input btn-add-item py-1 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm transition-colors flex items-center font-medium"
            onClick={() => addArrayItem(defaultValue)}
          >
            Add Item +
          </Button>
        </div>
      </div>
    );
  };

  const renderInputField = () => {
    switch (type) {
      case ParameterType.INT256:
        return (
          <input
            type="number"
            value={inputValue}
            onChange={handleChange}
            className={`parameter-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 text-sm ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder="Enter an int256 value (can be negative)"
          />
        );

      case ParameterType.UINT256:
        return (
          <input
            type="number"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === '-' || e.key === 'e') {
                e.preventDefault();
              }
            }}
            className={`parameter-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 text-sm ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder="Enter a uint256 value (non-negative)"
            min="0"
          />
        );

      case ParameterType.BOOL:
        return (
          <select
            value={String(inputValue)}
            onChange={(e) => {
              const newValue = e.target.value;
              // Special handling for "not set" value
              if (newValue === 'not_set') {
                setInputValue('');
                onChange('');
              } else {
                setInputValue(newValue === 'true');
                onChange(newValue === 'true');
              }
            }}
            className={`parameter-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 text-sm ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
          >
            <option value="not_set">Not set</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );

      case ParameterType.ADDRESS:
        return (
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            className={`parameter-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 text-sm ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder="0x..."
          />
        );

      case ParameterType.STRING:
        return (
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            className={`parameter-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 text-sm ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder="Enter a string value"
          />
        );

      case ParameterType.INT256_ARRAY:
      case ParameterType.UINT256_ARRAY:
      case ParameterType.BOOL_ARRAY:
      case ParameterType.ADDRESS_ARRAY:
      case ParameterType.STRING_ARRAY:
        return renderArrayFields(type);

      default:
        return (
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            className={`parameter-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 text-sm ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder={`Enter a ${typeName} value`}
          />
        );
    }
  };

  return (
    <div className="parameter-input-container border border-gray-200 rounded-lg overflow-hidden bg-white mb-3 font-sans">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
        <label className="parameter-label text-gray-700 font-medium text-sm flex items-center justify-between">
          <div>{name}</div>
          <span className="parameter-type text-xs text-gray-500 font-mono">({typeName})</span>
        </label>
      </div>
      <div className="p-3">
        {renderInputField()}
        {error && <div className="parameter-error text-red-500 text-xs mt-1">{error}</div>}
      </div>
    </div>
  );
}
