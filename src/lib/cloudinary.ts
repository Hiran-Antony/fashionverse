const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'fashionverse_unsigned';

if (!CLOUD_NAME) {
  console.warn(
    '⚠️ Cloudinary cloud name missing. Add VITE_CLOUDINARY_CLOUD_NAME to your .env file.'
  );
}

/**
 * Upload an image to Cloudinary.
 * Returns the secure URL of the uploaded image.
 */
export async function uploadImage(
  file: File,
  folder: string = 'products'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', `fashionverse/${folder}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Delete an image from Cloudinary by its public ID.
 * NOTE: Deletion from the client side requires signed uploads.
 * For now, old images will be overwritten or manually cleaned.
 */
export async function deleteImage(publicId: string): Promise<void> {
  // Requires server-side handling via Supabase Edge Function
  console.warn('Image deletion requires server-side implementation:', publicId);
}

/**
 * Generate an optimized Cloudinary URL with transformations.
 * @param url - Original Cloudinary URL
 * @param width - Desired width
 * @param quality - Image quality (auto by default)
 */
export function getOptimizedUrl(
  url: string,
  width: number = 800,
  quality: string = 'auto'
): string {
  if (!url || !url.includes('cloudinary.com')) return url;

  // Insert transformations after /upload/
  return url.replace(
    '/upload/',
    `/upload/f_auto,q_${quality},w_${width},c_limit/`
  );
}

/**
 * Generate a tiny blur placeholder URL for skeleton loading.
 */
export function getBlurUrl(url: string): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace(
    '/upload/',
    '/upload/f_auto,q_10,w_30,e_blur:1000/'
  );
}
