/**
 * Image upload validation helpers.
 */

export const ALLOWED_IMAGE_MIMES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates a File for property image upload. Returns { ok, error?, ext? }.
 */
export function validateImageFile(file) {
  if (!file) {
    return { ok: false, error: 'Archivo no válido' };
  }

  const ext = ALLOWED_IMAGE_MIMES[file.type];
  if (!ext) {
    return { ok: false, error: 'Solo se permiten imágenes JPEG, PNG o WebP' };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Cada imagen debe pesar máximo 5 MB' };
  }

  return { ok: true, ext };
}
