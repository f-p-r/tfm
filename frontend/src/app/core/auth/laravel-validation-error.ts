export interface LaravelValidationError {
  message?: string;
  errors?: Record<string, string[]>;
}

export function isLaravelValidationError(error: unknown): error is LaravelValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('message' in error || 'errors' in error) &&
    (!('errors' in error) ||
      (typeof error.errors === 'object' &&
        error.errors !== null &&
        Object.values(error.errors).every(
          (v) => Array.isArray(v) && v.every((item) => typeof item === 'string')
        )))
  );
}
