export interface ImageValidationOptions {
  allowedTypes?: string[];
  maxSize?: number;
  requireSquare?: boolean;
}

export interface ImageUploadResult {
  base64String: string;
  previewUrl: string;
}

export const DEFAULT_IMAGE_OPTIONS: ImageValidationOptions = {
  allowedTypes: ['image/svg+xml'],
  maxSize: 128 * 1024, // 128KB
  requireSquare: false, // SVGs don't have inherent dimensions like raster images
};

/**
 * Validates and processes an image file upload
 * @param file - The file to process
 * @param options - Validation options
 * @returns Promise resolving to base64 string and preview URL
 */
export const processImageUpload = async (
  file: File,
  options: ImageValidationOptions = DEFAULT_IMAGE_OPTIONS,
): Promise<ImageUploadResult> => {
  const { allowedTypes, maxSize, requireSquare } = { ...DEFAULT_IMAGE_OPTIONS, ...options };

  // Validate file type
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    throw new Error(`Only ${allowedTypes.join(', ')} images are supported`);
  }

  // Validate file size
  if (maxSize && file.size > maxSize) {
    throw new Error(`File size must be less than ${Math.round(maxSize / 1024)}KB`);
  }

  // Create preview URL
  const previewUrl = URL.createObjectURL(file);

  try {
    // Load and validate image dimensions
    const img = await loadImage(previewUrl);

    if (requireSquare && img.width !== img.height) {
      throw new Error(
        `Image must be square (1:1 aspect ratio). Your image is ${img.width}x${img.height}px.`,
      );
    }

    // Convert to base64
    const base64String = await fileToBase64(file);

    return { base64String, previewUrl };
  } catch (error) {
    // Clean up preview URL on error
    URL.revokeObjectURL(previewUrl);
    throw error;
  }
};

/**
 * Loads an image and returns a promise that resolves to HTMLImageElement
 * @param src - Image source URL
 * @returns Promise resolving to loaded image
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image. Please try a different file.'));
    img.src = src;
  });
};

/**
 * Converts a file to base64 string
 * @param file - The file to convert
 * @returns Promise resolving to base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Cleans up a preview URL created by URL.createObjectURL
 * @param previewUrl - The URL to clean up
 */
export const cleanupPreviewUrl = (previewUrl: string | null): void => {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
};
