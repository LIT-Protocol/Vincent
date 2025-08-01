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
            {required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <div className="space-y-4">
              {displayUrl && (
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
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
                  className={`w-full px-2 py-1.5 text-sm border rounded-md border-gray-300 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <div className="text-xs text-gray-600">Upload an SVG (max ~128KB)</div>

                {isUploading && (
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
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
