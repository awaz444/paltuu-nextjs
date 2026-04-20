/**
 * A lightweight validation utility to ensure API inputs are safe and consistent.
 * Used as a fallback since external dependencies cannot be installed currently.
 */
export type ValidationSchema = {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'email';
    min?: number;
    max?: number;
  };
};

export function validate(data: any, schema: ValidationSchema): { success: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];

    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} is required`);
      continue;
    }

    if (value !== undefined && value !== null && value !== '') {
      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${key} must be a string`);
      } else if (rules.type === 'number' && typeof value !== 'number') {
        errors.push(`${key} must be a number`);
      } else if (rules.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          errors.push(`${key} must be a valid email`);
        }
      }

      if (rules.min !== undefined) {
        if (typeof value === 'string' && value.length < rules.min) {
          errors.push(`${key} must be at least ${rules.min} characters`);
        } else if (typeof value === 'number' && value < rules.min) {
          errors.push(`${key} must be at least ${rules.min}`);
        }
      }
    }
  }

  return {
    success: errors.length === 0,
    errors
  };
}
