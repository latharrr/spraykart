export const MAX_PRODUCT_IMAGE_FILES = 10;
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

function isUploadFile(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.arrayBuffer === 'function' &&
    typeof value.size === 'number'
  );
}

export function validateProductImageFiles(formData, field = 'images') {
  const files = formData
    .getAll(field)
    .filter((file) => isUploadFile(file) && file.size > 0);

  if (files.length > MAX_PRODUCT_IMAGE_FILES) {
    return {
      files: [],
      error: {
        status: 413,
        message: `Upload a maximum of ${MAX_PRODUCT_IMAGE_FILES} product images at a time.`,
      },
    };
  }

  const oversized = files.find((file) => file.size > MAX_PRODUCT_IMAGE_BYTES);
  if (oversized) {
    return {
      files: [],
      error: {
        status: 413,
        message: `Each product image must be ${MAX_PRODUCT_IMAGE_BYTES / 1024 / 1024} MB or smaller.`,
      },
    };
  }

  return { files, error: null };
}
