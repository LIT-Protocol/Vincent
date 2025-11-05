import { useState } from 'react';
import { Button } from '@/components/shared/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/shared/ui/form';
import {
  UseFormWatch,
  UseFormSetValue,
  Control,
  UseFormSetError,
  UseFormClearErrors,
} from 'react-hook-form';
import { processImageUpload, cleanupPreviewUrl } from '@/utils/developer-dashboard/imageUtils';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

interface ImageUploadFieldProps {
  name: string;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  control: Control<any>;
  setError: UseFormSetError<any>;
  clearErrors: UseFormClearErrors<any>;
  label: string;
  required?: boolean;
}

export function ImageUploadField({
  name,
  watch,
  setValue,
  control,
  setError,
  clearErrors,
  label,
  required = false,
}: ImageUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const currentValue = watch(name);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    clearErrors(name);
    if (previewUrl) {
      cleanupPreviewUrl(previewUrl);
      setPreviewUrl(null);
    }

    setIsUploading(true);
    try {
      const result = await processImageUpload(file);
      setValue(name, result.base64String);
      setPreviewUrl(result.previewUrl);
    } catch (error) {
      console.error('Failed to process image:', error);
      // Clear the file input
      event.target.value = '';

      // Show validation error to user
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process image. Please try again.';
      setError(name, { message: errorMessage });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setValue(name, '');
    if (previewUrl) {
      cleanupPreviewUrl(previewUrl);
      setPreviewUrl(null);
    }
    clearErrors(name);
  };

  const displayUrl =
    previewUrl ||
    (currentValue && !currentValue.startsWith('data:')
      ? `data:image/svg+xml;base64,${currentValue}`
      : currentValue) ||
    null;

  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <div className="space-y-4">
              {displayUrl && (
                <div
                  className={`relative w-32 h-32 border ${theme.cardBorder} rounded-lg overflow-hidden ${theme.itemBg}`}
                >
                  <img src={displayUrl} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1"
                    onClick={handleRemove}
                  >
                    ×
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/svg+xml"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className={`block w-full text-sm border ${theme.mainCardBorder} ${theme.bg} ${theme.text} rounded-md file:mr-2 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-medium ${theme.itemBg} hover:file:bg-gray-100 dark:hover:file:bg-white/20 transition-colors ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={fonts.body}
                />
                <div className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                  Upload an SVG (max ~128KB)
                </div>

                {isUploading && (
                  <div
                    className={`flex items-center space-x-2 text-xs ${theme.textMuted}`}
                    style={fonts.body}
                  >
                    <div
                      className={`animate-spin rounded-full h-3 w-3 border-b-2`}
                      style={{ borderColor: theme.brandOrange }}
                    ></div>
                    <span>Processing image...</span>
                  </div>
                )}
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
